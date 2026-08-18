// Dedicated Web Worker for Pyodide WebAssembly Python Execution (ES Module Worker)
import { parsePythonTraceback } from '../utils/errorParser';
import { WorkerInMessage } from './types';

let pyodideInstance: any = null;
let isLoading = false;
let isReady = false;

// Initialize Pyodide inside the ES Module worker
async function initPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return pyodideInstance;
  }

  isLoading = true;
  try {
    let loadPyodideFn: any;

    // Load Pyodide via ES Module (.mjs)
    try {
      // @ts-ignore
      const pyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs');
      loadPyodideFn = pyodideModule.loadPyodide;
    } catch (esmErr) {
      console.warn('[Pyodide Worker] ESM CDN import fallback check:', esmErr);
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

    // Prepare virtual workspace directory
    try {
      pyodideInstance.FS.mkdir('/workspace');
    } catch {
      // Directory might already exist
    }

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

// Execute Python code in worker
async function runPython(payload: any, messageId?: string) {
  const startTime = Date.now();
  const filename = payload.filename || 'main.py';
  const targetCode = payload.code || '';
  const auxFiles = payload.files || [];
  const stdinText = payload.stdin || '';
  const maxOutputSize = payload.maxOutputSize || 1024 * 1024;
  const lang = payload.lang || 'en';
  const procId = payload.processId || `proc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    const py = await initPyodide();

    // Expose synchronous interactive input provider to Pyodide
    (self as any)._ilmhub_worker_input = (promptText: string) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const safePrompt = promptText !== undefined && promptText !== null ? String(promptText) : '';

      // Post notification to main thread so UI can display interactive prompt and focus input
      self.postMessage({
        type: 'INPUT_REQUEST',
        payload: {
          requestId,
          prompt: safePrompt,
          processId: procId,
        },
      });

      // Synchronous XMLHttpRequest to wait for user input
      try {
        const xhr = new XMLHttpRequest();
        const url = `/api/worker-input/wait?requestId=${encodeURIComponent(requestId)}&prompt=${encodeURIComponent(safePrompt)}&processId=${encodeURIComponent(procId)}`;
        xhr.open('GET', url, false); // Synchronous call in Web Worker
        xhr.send(null);

        if (xhr.status === 200) {
          const resp = JSON.parse(xhr.responseText);
          const userVal = resp.value !== undefined ? String(resp.value) : '';
          self.postMessage({
            type: 'INPUT_RESOLVED',
            payload: {
              requestId,
              value: userVal,
              processId: procId,
            },
          });
          return userVal;
        }
      } catch (err) {
        console.warn('[Pyodide Worker] Synchronous input request error:', err);
      }

      return '';
    };

    // Register JS module in Pyodide for bridge access
    try {
      py.registerJsModule('ilmhub_bridge', {
        request_input: (promptStr: string) => {
          return (self as any)._ilmhub_worker_input(promptStr);
        },
      });
    } catch {
      // module might already be registered
    }

    // Mount workspace files
    try {
      py.FS.mkdir('/workspace');
    } catch {
      // ignore
    }

    // Write all auxiliary files to /workspace
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

    // Write primary file
    py.FS.writeFile(`/workspace/${filename}`, targetCode, { encoding: 'utf8' });

    // Build the execution runner wrapper in Python
    const runnerScript = `
import sys
import io
import os
import builtins
import traceback
import js

# Setup workspace environment
os.chdir('/workspace')
if '/workspace' not in sys.path:
    sys.path.insert(0, '/workspace')

# Capture buffers
_ilmhub_stdout = io.StringIO()
_ilmhub_stderr = io.StringIO()
_orig_stdout = sys.stdout
_orig_stderr = sys.stderr
sys.stdout = _ilmhub_stdout
sys.stderr = _ilmhub_stderr

# Stdin buffer handler
_ilmhub_stdin_lines = ${JSON.stringify(stdinText)}.split('\\n')
if ${JSON.stringify(stdinText)} == "":
    _ilmhub_stdin_lines = []
_ilmhub_stdin_index = 0

def _ilmhub_custom_input(prompt=""):
    global _ilmhub_stdin_index
    prompt_str = str(prompt) if prompt is not None else ""
    if prompt_str:
        sys.stdout.write(prompt_str)
        sys.stdout.flush()
    
    # 1. Use pre-provided stdin buffer if available
    if _ilmhub_stdin_index < len(_ilmhub_stdin_lines):
        val = _ilmhub_stdin_lines[_ilmhub_stdin_index]
        _ilmhub_stdin_index += 1
        sys.stdout.write(val + "\\n")
        sys.stdout.flush()
        return val

    # 2. Interactive synchronous input via Web Worker / Server bridge
    try:
        if hasattr(js, '_ilmhub_worker_input'):
            val = str(js._ilmhub_worker_input(prompt_str))
            sys.stdout.write(val + "\\n")
            sys.stdout.flush()
            return val
    except Exception:
        pass

    try:
        import ilmhub_bridge
        val = str(ilmhub_bridge.request_input(prompt_str))
        sys.stdout.write(val + "\\n")
        sys.stdout.flush()
        return val
    except Exception:
        pass

    return ""

builtins.input = _ilmhub_custom_input

_ilmhub_exit_code = 0
_ilmhub_exception = None
_ilmhub_traceback = ""

try:
    with open('/workspace/${filename}', 'r', encoding='utf-8') as _f:
        _code_to_exec = _f.read()
    
    # Execute code in clean global namespace
    _user_globals = {
        '__name__': '__main__',
        '__file__': '/workspace/${filename}',
        '__doc__': None,
    }
    exec(compile(_code_to_exec, '${filename}', 'exec'), _user_globals)
except SystemExit as _e:
    _ilmhub_exit_code = _e.code if _e.code is not None else 0
    if isinstance(_ilmhub_exit_code, str):
        _ilmhub_stderr.write(str(_ilmhub_exit_code) + '\\n')
        _ilmhub_exit_code = 1
except BaseException as _e:
    _ilmhub_exit_code = 1
    _ilmhub_exception = _e
    _ilmhub_traceback = traceback.format_exc()
finally:
    sys.stdout = _orig_stdout
    sys.stderr = _orig_stderr

_ilmhub_raw_stdout = _ilmhub_stdout.getvalue()
_ilmhub_raw_stderr = _ilmhub_stderr.getvalue()
if _ilmhub_traceback:
    if _ilmhub_raw_stderr:
        _ilmhub_raw_stderr += "\\n" + _ilmhub_traceback
    else:
        _ilmhub_raw_stderr = _ilmhub_traceback
`;

    await py.runPythonAsync(runnerScript);

    let stdoutStr: string = py.globals.get('_ilmhub_raw_stdout') || '';
    let stderrStr: string = py.globals.get('_ilmhub_raw_stderr') || '';
    let exitCode: number = py.globals.get('_ilmhub_exit_code');

    if (exitCode === undefined || exitCode === null) {
      exitCode = 0;
    }

    // Output truncation check
    let outputTruncated = false;
    if (stdoutStr.length > maxOutputSize) {
      stdoutStr = stdoutStr.substring(0, maxOutputSize);
      outputTruncated = true;
      stderrStr += `\n[ILMHUB]: Output limit of ${(maxOutputSize / 1024).toFixed(0)}KB reached. Output was truncated.`;
    }

    const durationSec = Math.max((Date.now() - startTime) / 1000, 0.01);

    // Parse traceback if any error occurred
    let parsedError = null;
    if (stderrStr.trim() || exitCode !== 0) {
      parsedError = parsePythonTraceback(stderrStr || stdoutStr, filename, lang);
    }

    const isSuccess = exitCode === 0 && !parsedError;

    const result = {
      success: isSuccess,
      stdout: stdoutStr,
      stderr: stderrStr,
      exit_code: exitCode,
      execution_time: Number(durationSec.toFixed(3)),
      error: parsedError,
      timed_out: false,
      cancelled: false,
      output_truncated: outputTruncated,
      processId: payload.processId,
    };

    self.postMessage({
      type: 'RESULT',
      id: messageId,
      payload: result,
    });
  } catch (err: any) {
    const durationSec = Math.max((Date.now() - startTime) / 1000, 0.01);
    const errText = err?.message || String(err);
    const parsedError = parsePythonTraceback(errText, filename, lang);

    self.postMessage({
      type: 'RESULT',
      id: messageId,
      payload: {
        success: false,
        stdout: '',
        stderr: errText,
        exit_code: 1,
        execution_time: Number(durationSec.toFixed(3)),
        error: parsedError,
        timed_out: false,
        cancelled: false,
        processId: payload.processId,
      },
    });
  }
}

// Handle incoming messages from the main thread
self.addEventListener('message', async (e: MessageEvent<WorkerInMessage>) => {
  const { type, payload, id } = e.data;

  switch (type) {
    case 'INIT':
      try {
        await initPyodide();
      } catch (err) {
        // logged above
      }
      break;

    case 'RUN':
      await runPython(payload, id);
      break;

    case 'CANCEL':
      // Handled via worker termination in PythonExecutor
      break;

    default:
      console.warn('[Pyodide Worker] Unknown message type:', type);
  }
});
