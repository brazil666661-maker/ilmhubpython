import { ExecutionRequest, ExecutionResponse, AppLanguage, ParsedPythonError } from '../types';
import { parsePythonTraceback } from '../utils/errorParser';

export interface InputRequestEvent {
  requestId: string;
  prompt: string;
  processId: string;
}

export interface InputResolvedEvent {
  requestId: string;
  value: string;
  processId: string;
}

export interface OutputEvent {
  type: 'stdout' | 'stderr';
  text: string;
  processId?: string;
}

export interface RuntimeInfoEvent {
  pythonVersion: string;
  pyodideVersion: string;
}

class PythonExecutorEngine {
  private worker: Worker | null = null;
  private activeReject: ((reason?: any) => void) | null = null;
  private activeResolve: ((value: ExecutionResponse) => void) | null = null;
  private activeTimeoutHandle: any = null;
  private currentProcessId: string | null = null;
  private inputRequestListeners: Set<(event: InputRequestEvent) => void> = new Set();
  private inputResolvedListeners: Set<(event: InputResolvedEvent) => void> = new Set();
  private outputListeners: Set<(event: OutputEvent) => void> = new Set();
  private runtimeInfoListeners: Set<(event: RuntimeInfoEvent) => void> = new Set();
  private runtimeVersion = 'Python 3.x';
  private workerReadyPromise: Promise<void> | null = null;

  public onInputRequest(listener: (event: InputRequestEvent) => void): () => void {
    this.inputRequestListeners.add(listener);
    return () => this.inputRequestListeners.delete(listener);
  }

  public onInputResolved(listener: (event: InputResolvedEvent) => void): () => void {
    this.inputResolvedListeners.add(listener);
    return () => this.inputResolvedListeners.delete(listener);
  }

  public onOutput(listener: (event: OutputEvent) => void): () => void {
    this.outputListeners.add(listener);
    return () => this.outputListeners.delete(listener);
  }

  public onRuntimeInfo(listener: (event: RuntimeInfoEvent) => void): () => void {
    this.runtimeInfoListeners.add(listener);
    return () => this.runtimeInfoListeners.delete(listener);
  }

  public getRuntimeVersion(): string {
    return this.runtimeVersion;
  }

  public async waitForWorkerReady(): Promise<void> {
    if (!this.worker) {
      this.getWorker();
    }
    if (!this.workerReadyPromise) {
      this.workerReadyPromise = new Promise((resolve) => {
        const onReady = (event: MessageEvent) => {
          if (event.data?.type === 'READY') {
            this.worker!.removeEventListener('message', onReady as EventListener);
            resolve();
          }
        };
        if (this.worker) {
          this.worker.addEventListener('message', onReady as EventListener);
          this.worker.postMessage({ type: 'INIT' });
        }
      });
    }
    await this.workerReadyPromise;
  }

  public async provideInput(value: string, requestId?: string, processId?: string): Promise<boolean> {
    try {
      const targetProcessId = processId || this.currentProcessId;
      if (this.worker) {
        this.worker.postMessage({
          type: 'INPUT_RESPONSE',
          payload: {
            requestId,
            processId: targetProcessId || undefined,
            value,
          },
        });
        return true;
      }

      const resp = await fetch('/api/worker-input/provide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value,
          requestId,
          processId: targetProcessId,
        }),
      });
      const data = await resp.json();
      return Boolean(data.success);
    } catch (e) {
      console.warn('[PythonExecutor] Failed to provide input:', e);
      return false;
    }
  }

  private getWorker(): Worker {
    if (typeof Worker === 'undefined') {
      throw new Error('Web Worker is not supported or available in this environment');
    }

    if (!this.worker) {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (e: MessageEvent) => {
        const { type, payload } = e.data || {};

        if (type === 'RUNTIME_INFO') {
          const nextVersion = payload?.pythonVersion || 'Python 3.x';
          this.runtimeVersion = nextVersion;
          this.runtimeInfoListeners.forEach((fn) =>
            fn({
              pythonVersion: nextVersion,
              pyodideVersion: payload?.pyodideVersion || '0.26.4',
            })
          );
          return;
        }

        if (type === 'STDOUT' || type === 'STDERR') {
          this.outputListeners.forEach((fn) =>
            fn({
              type: type === 'STDERR' ? 'stderr' : 'stdout',
              text: String(payload?.text || ''),
              processId: payload?.processId || this.currentProcessId || undefined,
            })
          );
          return;
        }

        if (type === 'INPUT_REQUEST') {
          if (this.activeTimeoutHandle) {
            clearTimeout(this.activeTimeoutHandle);
            this.activeTimeoutHandle = null;
          }
          this.inputRequestListeners.forEach((fn) => fn(payload));
          return;
        }

        if (type === 'INPUT_RESOLVED') {
          if (!this.activeTimeoutHandle && this.activeResolve) {
            this.activeTimeoutHandle = setTimeout(() => {
              this.handleTimeout();
            }, 10000);
          }
          this.inputResolvedListeners.forEach((fn) => fn(payload));
          return;
        }

        if (type === 'RESULT') {
          if (this.activeTimeoutHandle) {
            clearTimeout(this.activeTimeoutHandle);
            this.activeTimeoutHandle = null;
          }

          if (this.activeResolve) {
            const resolve = this.activeResolve;
            this.activeResolve = null;
            this.activeReject = null;
            resolve(payload);
          }
          return;
        }

        if (type === 'ERROR') {
          if (this.activeTimeoutHandle) {
            clearTimeout(this.activeTimeoutHandle);
            this.activeTimeoutHandle = null;
          }

          if (this.activeResolve) {
            const resolve = this.activeResolve;
            this.activeResolve = null;
            this.activeReject = null;
            resolve({
              success: false,
              stdout: '',
              stderr: payload?.message || 'Execution error in Python WebAssembly runtime',
              exit_code: 1,
              execution_time: 0,
              error: {
                type: 'RuntimeError',
                message: payload?.message || 'Execution failed',
                file: 'main.py',
                line: 1,
                traceback: payload?.message || '',
                simpleExplanation: 'An error occurred inside the Python runtime.',
                suggestedFix: 'Please check your code or retry.',
              },
            });
          }
        }
      };

      this.worker.onerror = (err) => {
        console.error('[PythonExecutor] Worker internal error:', err);
        if (this.activeTimeoutHandle) {
          clearTimeout(this.activeTimeoutHandle);
          this.activeTimeoutHandle = null;
        }

        if (this.activeResolve) {
          const resolve = this.activeResolve;
          this.activeResolve = null;
          this.activeReject = null;
          resolve({
            success: false,
            stdout: '',
            stderr: `Worker error: ${err.message || 'Script evaluation error'}`,
            exit_code: 1,
            execution_time: 0,
            error: {
              type: 'RuntimeError',
              message: err.message || 'Worker failure',
              file: 'main.py',
              line: 1,
              traceback: err.message || '',
              simpleExplanation: 'The Python execution worker encountered a critical error.',
              suggestedFix: 'Try running the code again.',
            },
          });
        }

        this.terminateAndReset();
      };
    }
    return this.worker;
  }

  private handleTimeout(timeoutSec = 30, filename = 'main.py'): void {
    if (!this.activeResolve) return;
    const processId = this.currentProcessId || 'default';
    this.terminateAndReset();

    const timeoutError: ParsedPythonError = {
      type: 'TimeoutError',
      message: `Execution timed out after ${timeoutSec} seconds.`,
      file: filename,
      line: 1,
      traceback: `TimeoutError: Execution exceeded time limit of ${timeoutSec} seconds.`,
      simpleExplanation: `Your Python code took longer than ${timeoutSec} seconds to execute. This is often caused by infinite loops or long-running computations.`,
      suggestedFix: 'Check while loops for proper incrementing/termination conditions and optimize heavy calculations.',
    };

    const res = this.activeResolve;
    this.activeResolve = null;
    this.activeReject = null;
    res({
      success: false,
      stdout: '',
      stderr: `\n[ILMHUB]: Execution timed out after ${timeoutSec} seconds.`,
      exit_code: 124,
      execution_time: timeoutSec,
      error: timeoutError,
      timed_out: true,
      cancelled: false,
      processId,
    });
  }

  public preload(): void {
    try {
      const worker = this.getWorker();
      if (worker) {
        worker.postMessage({ type: 'INIT' });
      }
    } catch (e) {
      console.warn('[PythonExecutor] Preload failed:', e);
    }
  }

  public terminateAndReset(): void {
    if (this.activeTimeoutHandle) {
      clearTimeout(this.activeTimeoutHandle);
      this.activeTimeoutHandle = null;
    }

    if (this.worker) {
      try {
        this.worker.terminate();
      } catch (e) {
        console.warn('[PythonExecutor] Could not terminate worker:', e);
      }
      this.worker = null;
    }

    this.currentProcessId = null;
  }

  public cancel(processId?: string): boolean {
    const targetProcessId = processId || this.currentProcessId;
    if (this.activeResolve || this.worker) {
      const resolve = this.activeResolve;
      this.activeResolve = null;
      this.activeReject = null;

      if (this.activeTimeoutHandle) {
        clearTimeout(this.activeTimeoutHandle);
        this.activeTimeoutHandle = null;
      }

      if (this.worker) {
        this.worker.postMessage({ type: 'CANCEL', payload: { processId: targetProcessId } });
      }

      this.terminateAndReset();

      if (resolve) {
        resolve({
          success: false,
          stdout: '',
          stderr: '^C Process cancelled by user.',
          exit_code: 130,
          execution_time: 0,
          error: null,
          cancelled: true,
          timed_out: false,
          processId: targetProcessId || undefined,
        });
      }

      return true;
    }
    return false;
  }

  public async execute(req: ExecutionRequest, lang: AppLanguage = 'en'): Promise<ExecutionResponse> {
    const filename = req.filename || 'main.py';
    const timeoutSec = req.timeout && req.timeout > 0 ? req.timeout : 30;
    const timeoutMs = timeoutSec * 1000;
    const processId = req.processId || `proc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.currentProcessId = processId;

    if (this.activeResolve) {
      this.cancel();
    }

    return new Promise<ExecutionResponse>((resolve, reject) => {
      this.activeResolve = resolve;
      this.activeReject = reject;

      const worker = this.getWorker();
      this.activeTimeoutHandle = setTimeout(() => {
        console.warn(`[PythonExecutor] Execution timed out after ${timeoutSec}s`);
        this.terminateAndReset();

        const timeoutError: ParsedPythonError = {
          type: 'TimeoutError',
          message: `Execution timed out after ${timeoutSec} seconds.`,
          file: filename,
          line: 1,
          traceback: `TimeoutError: Execution exceeded time limit of ${timeoutSec} seconds.`,
          simpleExplanation: `Your Python code took longer than ${timeoutSec} seconds to execute. This is often caused by infinite loops or long-running computations.`,
          suggestedFix: 'Check while loops for proper incrementing/termination conditions and optimize heavy calculations.',
        };

        if (this.activeResolve) {
          const res = this.activeResolve;
          this.activeResolve = null;
          this.activeReject = null;
          res({
            success: false,
            stdout: '',
            stderr: `\n[ILMHUB]: Execution timed out after ${timeoutSec} seconds.`,
            exit_code: 124,
            execution_time: timeoutSec,
            error: timeoutError,
            timed_out: true,
            cancelled: false,
            processId,
          });
        }
      }, timeoutMs);

      worker.postMessage({
        type: 'RUN',
        id: processId,
        payload: {
          code: req.code,
          filename,
          files: req.files || [],
          stdin: req.stdin || '',
          timeoutMs,
          maxOutputSize: req.maxOutputSize || 1024 * 1024,
          processId,
          lang,
        },
      });
    });
  }
}

export const PythonExecutor = new PythonExecutorEngine();
