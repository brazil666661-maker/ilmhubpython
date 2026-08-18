import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { parsePythonTraceback, ParsedPythonError } from './error_parser';

export interface ExecuteOptions {
  code: string;
  filename?: string;
  files?: Array<{ name: string; content: string }>;
  stdin?: string;
  timeout?: number;
  maxOutputSize?: number;
  processId?: string;
  lang?: 'en' | 'uz' | 'ru' | 'uz-cyrl';
}

export interface ExecuteResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  execution_time: number;
  error: ParsedPythonError | null;
  timed_out?: boolean;
  cancelled?: boolean;
  output_truncated?: boolean;
  processId: string;
}

// Active processes map for stop functionality
const activeProcesses = new Map<string, { process: ChildProcess; tempDir: string }>();

export function stopProcess(processId: string): boolean {
  const item = activeProcesses.get(processId);
  if (!item) return false;

  try {
    if (item.process && !item.process.killed) {
      item.process.kill('SIGTERM');
      setTimeout(() => {
        try {
          if (!item.process.killed) item.process.kill('SIGKILL');
        } catch {
          // ignore
        }
      }, 300);
    }
  } catch (err) {
    console.error(`Failed to kill process ${processId}:`, err);
  }

  try {
    if (fs.existsSync(item.tempDir)) {
      fs.rmSync(item.tempDir, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }

  activeProcesses.delete(processId);
  return true;
}

export async function executePythonCode(options: ExecuteOptions): Promise<ExecuteResult> {
  const processId = options.processId || `proc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timeoutMs = Math.min(Math.max((options.timeout || 10) * 1000, 1000), 30000); // 1s to 30s
  const maxBytes = Math.min(options.maxOutputSize || 1024 * 1024, 5 * 1024 * 1024); // max 5MB, default 1MB
  const targetFilename = options.filename || 'main.py';
  const lang = options.lang || 'en';

  // Create isolated temp workspace
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ilmhub-run-'));

  // Write primary code
  const mainFilePath = path.join(tempDir, targetFilename);
  fs.writeFileSync(mainFilePath, options.code || '', 'utf-8');

  // Write any auxiliary files provided
  if (options.files && Array.isArray(options.files)) {
    for (const f of options.files) {
      if (f.name && f.name !== targetFilename) {
        const safeName = path.basename(f.name);
        fs.writeFileSync(path.join(tempDir, safeName), f.content || '', 'utf-8');
      }
    }
  }

  const startTime = Date.now();
  let stdoutData = '';
  let stderrData = '';
  let totalBytes = 0;
  let isTruncated = false;
  let isTimedOut = false;
  let isCancelled = false;

  return new Promise<ExecuteResult>((resolve) => {
    // Sanitized minimal environment for safe execution
    const safeEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1',
      PYTHONDONTWRITEBYTECODE: '1',
      HOME: tempDir,
      TMPDIR: tempDir,
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
    };

    // Use python3 or python command
    const pythonCmd = 'python3';
    const pyProcess = spawn(pythonCmd, ['-u', targetFilename], {
      cwd: tempDir,
      env: safeEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    activeProcesses.set(processId, { process: pyProcess, tempDir });

    // Handle standard input if provided
    if (options.stdin && pyProcess.stdin) {
      try {
        pyProcess.stdin.write(options.stdin);
        pyProcess.stdin.end();
      } catch {
        // ignore
      }
    } else if (pyProcess.stdin) {
      try {
        pyProcess.stdin.end();
      } catch {
        // ignore
      }
    }

    // Set timeout timer
    const timeoutHandle = setTimeout(() => {
      isTimedOut = true;
      try {
        pyProcess.kill('SIGTERM');
        setTimeout(() => {
          try {
            if (!pyProcess.killed) pyProcess.kill('SIGKILL');
          } catch {
            // ignore
          }
        }, 400);
      } catch {
        // ignore
      }
    }, timeoutMs);

    pyProcess.stdout?.on('data', (chunk: Buffer) => {
      if (totalBytes < maxBytes) {
        const available = maxBytes - totalBytes;
        if (chunk.length > available) {
          stdoutData += chunk.subarray(0, available).toString('utf-8');
          totalBytes += available;
          isTruncated = true;
          try {
            pyProcess.kill('SIGTERM');
          } catch {
            // ignore
          }
        } else {
          stdoutData += chunk.toString('utf-8');
          totalBytes += chunk.length;
        }
      } else {
        isTruncated = true;
      }
    });

    pyProcess.stderr?.on('data', (chunk: Buffer) => {
      if (totalBytes < maxBytes) {
        const available = maxBytes - totalBytes;
        if (chunk.length > available) {
          stderrData += chunk.subarray(0, available).toString('utf-8');
          totalBytes += available;
          isTruncated = true;
        } else {
          stderrData += chunk.toString('utf-8');
          totalBytes += chunk.length;
        }
      } else {
        isTruncated = true;
      }
    });

    pyProcess.on('error', (err) => {
      clearTimeout(timeoutHandle);
      activeProcesses.delete(processId);
      const executionTime = Math.max((Date.now() - startTime) / 1000, 0.01);

      cleanupDir(tempDir);

      resolve({
        success: false,
        stdout: stdoutData,
        stderr: stderrData + `\nExecution error: ${err.message}`,
        exit_code: 1,
        execution_time: Number(executionTime.toFixed(3)),
        error: {
          type: 'ExecutionError',
          message: err.message,
          file: targetFilename,
          line: 1,
          traceback: err.message,
          simpleExplanation: 'Could not spawn Python process.',
          suggestedFix: 'Ensure standard Python runtime is available.',
        },
        processId,
      });
    });

    pyProcess.on('close', (code, signal) => {
      clearTimeout(timeoutHandle);
      activeProcesses.delete(processId);
      const executionTime = Math.max((Date.now() - startTime) / 1000, 0.01);

      cleanupDir(tempDir);

      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        if (!isTimedOut) {
          isCancelled = true;
        }
      }

      if (isTruncated) {
        stderrData += `\n[ILMHUB]: Output limit of ${(maxBytes / 1024).toFixed(0)}KB reached. Additional output was truncated.`;
      }

      if (isTimedOut) {
        stderrData += `\n[ILMHUB]: Execution timed out after ${(timeoutMs / 1000).toFixed(0)} seconds.`;
      }

      let parsedError: ParsedPythonError | null = null;
      if (stderrData.trim() || code !== 0) {
        parsedError = parsePythonTraceback(stderrData || stdoutData, targetFilename, lang);
      }

      const isSuccess = code === 0 && !isTimedOut && !isCancelled && !parsedError;

      resolve({
        success: isSuccess,
        stdout: stdoutData,
        stderr: stderrData,
        exit_code: isTimedOut ? 124 : isCancelled ? 130 : code,
        execution_time: Number(executionTime.toFixed(3)),
        error: parsedError,
        timed_out: isTimedOut,
        cancelled: isCancelled,
        output_truncated: isTruncated,
        processId,
      });
    });
  });
}

function cleanupDir(dirPath: string) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('Failed to clean temp directory:', e);
  }
}
