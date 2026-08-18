// Dedicated Web Worker for Pyodide WebAssembly Python Execution (ES Module Worker)
import { WorkerInMessage } from './types';
import { sanitizePythonCode } from './sanitize';

let pyodideInstance: any = null;
let isLoading = false;
let isReady = false;
let currentProcessId: string | null = null;
const pendingInputResolvers = new Map<string, (value: string) => void>();

export function buildRunnerScript(options: {
  filename: string;
  stdinText: string;
}) {
  const { filename, stdinText } = options;

  return `
import builtins
import io
import os
import sys
import traceback
import js

os.chdir('/workspace')
if '/workspace' not in sys.path:
    sys.path.insert(0, '/workspace')

stdin_lines = ${JSON.stringify(stdinText)}.splitlines()
if ${JSON.stringify(stdinText)} == '':
    stdin_lines = []
stdin_index = 0

class _ILMHUBStream(io.TextIOBase):
    def __init__(self, stream_name):
        self.stream_name = stream_name
        self._buffer = []

    def write(self, text):
        value = '' if text is None else str(text)
        if not value:
            return 0
        self._buffer.append(value)
        js._ilmhub_emit_output(self.stream_name, value)
        return len(value)

    def flush(self):
        pass

    def getvalue(self):
        return ''.join(self._buffer)


class _ILMHUBInputWrapper:
    def __init__(self, lines):
        self.lines = list(lines)
        self.index = 0

    def readline(self):
        if self.index < len(self.lines):
            value = self.lines[self.index]
            self.index += 1
            return value + '\n'
        return ''

    def read(self):
        values = []
        while self.index < len(self.lines):
            values.append(self.lines[self.index])
            self.index += 1
        return '\n'.join(values)


async def _ilmhub_input(prompt=''):
    global stdin_index
    prompt_str = str(prompt) if prompt is not None else ''
    if stdin_index < len(stdin_lines):
        value = stdin_lines[stdin_index]
        stdin_index += 1
        return value
    if hasattr(js, '_ilmhub_request_input'):
        value = await js._ilmhub_request_input(prompt_str)
        return '' if value is None else str(value)
    return ''

stdout_buffer = _ILMHUBStream('stdout')
stderr_buffer = _ILMHUBStream('stderr')
_orig_stdout = sys.stdout
_orig_stderr = sys.stderr
_orig_stdin = sys.stdin

sys.stdout = stdout_buffer
sys.stderr = stderr_buffer
sys.stdin = _ILMHUBInputWrapper(stdin_lines)

_builtins_input = builtins.input
builtins.input = _ilmhub_input

with open('/workspace/${filename}', 'r', encoding='utf-8') as _f:
    _source = _f.read()

_user_globals = {
    '__name__': '__main__',
    '__file__': '/workspace/${filename}',
    '__doc__': None,
    'input': _ilmhub_input,
    'print': print,
}

_ilmhub_exit_code = 0
_ilmhub_traceback = ''

try:
    exec(compile(_source, '${filename}', 'exec', dont_inherit=True), _user_globals, _user_globals)
except SystemExit as _e:
    _ilmhub_exit_code = _e.code if _e.code is not None else 0
    if isinstance(_ilmhub_exit_code, str):
        _ilmhub_exit_code = 1
except BaseException as _e:
    _ilmhub_exit_code = 1
    _ilmhub_traceback = traceback.format_exc()
finally:
    builtins.input = _builtins_input
    sys.stdout = _orig_stdout
    sys.stderr = _orig_stderr
    sys.stdin = _orig_stdin

_ilmhub_stdout = stdout_buffer.getvalue()
_ilmhub_stderr = stderr_buffer.getvalue()
_ilmhub_raw_stderr = _ilmhub_stderr
if _ilmhub_traceback:
    _ilmhub_raw_stderr = (_ilmhub_raw_stderr + '\\n' + _ilmhub_traceback).strip()
`;
}

function emitWorkerText(type: 'STDOUT' | 'STDERR', text: string, processId?: string) {
  if (!text) return;
  self.postMessage({
    type,
    payload: { text, processId: processId || currentProcessId || null },
  });
}

async function initPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return pyodideInstance;
  }

  isLoading = true;

  try {
    let loadPyodideFn: any;
    try {
      const pyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs');
      loadPyodideFn = pyodideModule.loadPyodide;
    } catch (esmErr) {
      console.warn('[Pyodide Worker] ESM import fallback check:', esmErr);
      if (typeof (self as any).loadPyodide === 'function') {
        loadPyodideFn = (self as any).loadPyodide;
      }
    }

    if (!loadPyodideFn) {
      throw new Error('Pyodide WebAssembly loader could not be initialized');
    }

    pyodideInstance = await loadPyodideFn({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });

    try {
      pyodideInstance.FS.mkdir('/workspace');
    } catch {
      // ignore
    }

    const pythonVersion = typeof pyodideInstance.version === 'string' && pyodideInstance.version
      ? pyodideInstance.version
      : 'Python 3.x';

    self.postMessage({
      type: 'RUNTIME_INFO',
      payload: {
        pythonVersion,
        pyodideVersion: '0.26.4',
      },
    });

    isReady = true;
    self.postMessage({ type: 'READY' });
    return pyodideInstance;
  } catch (err: any) {
    console.error('[Pyodide Worker] Initialization failed:', err);
    self.postMessage({
      type: 'ERROR',
      payload: { message: `Failed to initialize Pyodide WebAssembly: ${err?.message || 'Network error'}` },
    });
    throw err;
  } finally {
    isLoading = false;
  }
}

function resolveInputResponse(requestId?: string, processId?: string, value?: string) {
  const nextValue = value ?? '';
  if (requestId && pendingInputResolvers.has(requestId)) {
    const resolver = pendingInputResolvers.get(requestId)!;
    pendingInputResolvers.delete(requestId);
    resolver(nextValue);
    return;
  }

  if (processId) {
    for (const [id, resolver] of pendingInputResolvers.entries()) {
      pendingInputResolvers.delete(id);
      resolver(nextValue);
      return;
    }
  }
}

async function runPython(payload: any, messageId?: string) {
  const startTime = Date.now();
  const filename = payload.filename || 'main.py';
  const targetCode = payload.code || '';
  const auxFiles = payload.files || [];
  const stdinText = payload.stdin || '';
  const maxOutputSize = payload.maxOutputSize || 1024 * 1024;
  const lang = payload.lang || 'en';
  currentProcessId = payload.processId || `proc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    const py = await initPyodide();

    const requestInput = (promptText: string) => {
      return new Promise<string>((resolve) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const safePrompt = promptText !== undefined && promptText !== null ? String(promptText) : '';
        pendingInputResolvers.set(requestId, resolve);
        self.postMessage({
          type: 'INPUT_REQUEST',
          payload: {
            requestId,
            prompt: safePrompt,
            processId: currentProcessId,
          },
        });
      });
    };

    (self as any)._ilmhub_request_input = requestInput;

    try {
      py.registerJsModule('ilmhub_bridge', {
        request_input: (promptStr: string) => requestInput(promptStr),
      });
    } catch {
      // ignore if bridge already exists
    }

    try {
      py.FS.mkdir('/workspace');
    } catch {
      // ignore
    }

    for (const f of auxFiles) {
      if (f.name) {
        const safeName = f.name.replace(/^[/\\]+/, '');
        try {
          py.FS.writeFile(`/workspace/${safeName}`, f.content || '', { encoding: 'utf8' });
        } catch (fsErr) {
          console.warn(`[Pyodide] Could not write file ${safeName}:`, fsErr);
        }
      }
    }

    py.FS.writeFile(`/workspace/${filename}`, targetCode, { encoding: 'utf8' });

    const safeSourceCode = sanitizePythonCode(targetCode);
    py.FS.writeFile(`/workspace/${filename}`, safeSourceCode, { encoding: 'utf8' });

    const runnerScript = buildRunnerScript({ filename, stdinText });

    const emitProxy = (kind: 'stdout' | 'stderr', text: string) => {
      emitWorkerText(kind === 'stdout' ? 'STDOUT' : 'STDERR', text, currentProcessId || undefined);
    };
    (self as any)._ilmhub_emit_output = (kind: string, text: string) => {
      emitProxy(kind === 'stdout' ? 'stdout' : 'stderr', text);
    };

    try {
      py.globals.set('_ilmhub_emit_output', (self as any)._ilmhub_emit_output);
    } catch {
      // ignore
    }

    await py.runPythonAsync(runnerScript);

    const stdoutStr = String(py.globals.get('_ilmhub_stdout') || '');
    const stderrStr = String(py.globals.get('_ilmhub_stderr') || '');
    const exitCode = Number(py.globals.get('_ilmhub_exit_code') ?? 0);
    const tracebackText = String(py.globals.get('_ilmhub_traceback') || '');
    const finalStderr = (tracebackText ? `${stderrStr}\n${tracebackText}` : stderrStr).trim();
    const finalStdout = stdoutStr.length > maxOutputSize ? stdoutStr.slice(0, maxOutputSize) : stdoutStr;

    const result: any = {
      success: exitCode === 0 && !finalStderr,
      stdout: finalStdout,
      stderr: finalStderr,
      exit_code: exitCode,
      execution_time: Number(((Date.now() - startTime) / 1000).toFixed(3)),
      error: null,
      timed_out: false,
      cancelled: false,
      processId: currentProcessId,
    };

    if (finalStderr || exitCode !== 0) {
      result.error = {
        type: 'RuntimeError',
        message: finalStderr || 'Python execution failed',
        file: filename,
        line: 1,
        traceback: finalStderr || 'Python execution failed',
      };
    }

    if (finalStdout.length > maxOutputSize) {
      result.stderr = `${result.stderr || ''}\n[ILMHUB]: Output limit of ${(maxOutputSize / 1024).toFixed(0)}KB reached. Output was truncated.`;
      result.output_truncated = true;
    }

    self.postMessage({ type: 'RESULT', id: messageId, payload: result });
  } catch (err: any) {
    const errorText = err?.message || String(err);
    self.postMessage({
      type: 'RESULT',
      id: messageId,
      payload: {
        success: false,
        stdout: '',
        stderr: errorText,
        exit_code: 1,
        execution_time: Number(((Date.now() - startTime) / 1000).toFixed(3)),
        error: { type: 'RuntimeError', message: errorText, file: filename, line: 1, traceback: errorText },
        timed_out: false,
        cancelled: false,
        processId: currentProcessId,
      },
    });
  }
}

if (typeof self !== 'undefined') {
  self.addEventListener('message', async (e: MessageEvent<WorkerInMessage>) => {
    const { type, payload, id } = e.data;

    switch (type) {
      case 'INIT':
        try {
          await initPyodide();
        } catch {
          // already reported in initPyodide
        }
        break;

      case 'RUN':
        await runPython(payload, id);
        break;

      case 'INPUT_RESPONSE':
        resolveInputResponse((payload as any)?.requestId, (payload as any)?.processId, (payload as any)?.value);
        self.postMessage({
          type: 'INPUT_RESOLVED',
          payload: {
            requestId: (payload as any)?.requestId,
            processId: (payload as any)?.processId,
            value: (payload as any)?.value ?? '',
          },
        });
        break;

      case 'CANCEL':
        break;

      default:
        console.warn('[Pyodide Worker] Unknown message type:', type);
    }
  });
}
