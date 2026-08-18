// Dedicated Web Worker for Pyodide WebAssembly Python Execution (ES Module Worker)
// Implements true blocking input() via SharedArrayBuffer + Atomics
import { WorkerInMessage } from './types';
import { sanitizePythonCode } from './sanitize';

let pyodideInstance: any = null;
let isLoading = false;
let isReady = false;
let currentProcessId: string | null = null;
const pendingInputResolvers = new Map<string, (value: string) => void>();

// Shared memory for input synchronization
let sharedSignalBuffer: SharedArrayBuffer | null = null;
let sharedDataBuffer: SharedArrayBuffer | null = null;
let sharedSignal: Int32Array | null = null;
let sharedData: Uint8Array | null = null;

// Initialize shared buffers for cross-thread communication
function initializeSharedBuffers() {
  try {
    // Signal buffer: 1 Int32 (index 0 holds the wait/notify signal)
    sharedSignalBuffer = new SharedArrayBuffer(4);
    sharedSignal = new Int32Array(sharedSignalBuffer);
    sharedSignal[0] = 0; // 0 = waiting for input, 1 = input ready

    // Data buffer: 4096 bytes (first 4 bytes = length, rest = UTF-8 string)
    sharedDataBuffer = new SharedArrayBuffer(4096);
    sharedData = new Uint8Array(sharedDataBuffer);
    // Initialize with zeros
    sharedData.fill(0);
  } catch (err) {
    console.warn('[Pyodide Worker] SharedArrayBuffer not available:', err);
    // Fall back to message-based communication
  }
}

// Export shared buffers to Python
function exposeSharedBuffersToPython(py: any) {
  if (!sharedSignalBuffer || !sharedDataBuffer) {
    return;
  }

  try {
    py.globals.set('_ilmhub_shared_signal', sharedSignalBuffer);
    py.globals.set('_ilmhub_shared_data', sharedDataBuffer);
  } catch (err) {
    console.warn('[Pyodide Worker] Could not expose buffers to Python:', err);
  }
}

export function buildRunnerScript(options: {
  filename: string;
  stdinText: string;
}) {
  const { filename, stdinText } = options;

  return `
import asyncio
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
            return value + '\\n'
        return ''

    def read(self):
        values = []
        while self.index < len(self.lines):
            values.append(self.lines[self.index])
            self.index += 1
        return '\\n'.join(values)


def _ilmhub_blocking_input(prompt=''):
    \"\"\"
    True blocking input() using SharedArrayBuffer + Atomics.
    This pauses the Python interpreter until the user provides input.
    \"\"\"
    prompt_str = str(prompt) if prompt is not None else ''
    
    # Request input from main thread
    js._ilmhub_request_blocking_input(prompt_str)
    
    # Wait for signal that input is ready (Atomics.wait is truly blocking)
    if hasattr(js, '_ilmhub_atomics_wait_for_input'):
        input_value = js._ilmhub_atomics_wait_for_input()
        return '' if input_value is None else str(input_value)
    
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
builtins.input = _ilmhub_blocking_input

_user_globals = {
    '__name__': '__main__',
    '__file__': '/workspace/${filename}',
    '__doc__': None,
    'input': _ilmhub_blocking_input,
    'print': print,
}

_ilmhub_exit_code = 0
_ilmhub_traceback = ''

try:
    user_code = globals().get('user_code', '')
    if not isinstance(user_code, str):
        user_code = ''
    exec(compile(user_code, '${filename}', 'exec', dont_inherit=True), _user_globals, _user_globals)
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
    // Initialize shared buffers for true blocking input
    initializeSharedBuffers();

    const py = await initPyodide();

    // Expose shared buffers to Python
    exposeSharedBuffersToPython(py);

    let buffersSentToMain = false;

    // Define JS functions that Python will call for blocking input
    const requestBlockingInput = (promptText: string) => {
      const payload: any = {
        prompt: promptText,
        processId: currentProcessId,
      };

      // Send shared buffers on first INPUT_REQUEST
      if (!buffersSentToMain && sharedSignalBuffer && sharedDataBuffer) {
        payload.sharedSignalBuffer = sharedSignalBuffer;
        payload.sharedDataBuffer = sharedDataBuffer;
        buffersSentToMain = true;
      }

      self.postMessage({
        type: 'INPUT_REQUEST',
        payload,
      });
    };

    // Atomics-based wait function: blocks until main thread signals with input
    const atomicsWaitForInput = (): string => {
      if (!sharedSignal || !sharedData) {
        // Fallback: no SharedArrayBuffer support
        console.warn('[Pyodide Worker] SharedArrayBuffer not available for true blocking input');
        return '';
      }

      try {
        // Reset signal to 0 (waiting)
        Atomics.store(sharedSignal, 0, 0);

        // Wait for main thread to set signal to 1 (input ready)
        // This truly blocks the worker thread without freezing the main thread
        Atomics.wait(sharedSignal, 0, 0);

        // Signal received; read input from shared data buffer
        const lengthBytes = sharedData.slice(0, 4);
        const lengthView = new DataView(lengthBytes.buffer);
        const inputLength = lengthView.getUint32(0, true); // little-endian

        if (inputLength > 0 && inputLength <= 4092) {
          const inputBytes = sharedData.slice(4, 4 + inputLength);
          const decoder = new TextDecoder('utf-8');
          const inputValue = decoder.decode(inputBytes);
          return inputValue;
        }

        return '';
      } catch (err) {
        console.warn('[Pyodide Worker] Atomics.wait error:', err);
        return '';
      }
    };

    // Expose input functions to Python
    (self as any)._ilmhub_request_blocking_input = requestBlockingInput;
    (self as any)._ilmhub_atomics_wait_for_input = atomicsWaitForInput;

    try {
      py.globals.set('_ilmhub_request_blocking_input', requestBlockingInput);
      py.globals.set('_ilmhub_atomics_wait_for_input', atomicsWaitForInput);
    } catch {
      // ignore
    }

    try {
      py.registerJsModule('ilmhub_bridge', {
        request_blocking_input: requestBlockingInput,
        atomics_wait_for_input: atomicsWaitForInput,
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
    py.globals.set('user_code', safeSourceCode);

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
