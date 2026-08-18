import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  explainPythonCode,
  fixPythonError,
  generatePythonCode,
  reviewPythonCode,
  chatWithAI,
} from './server/gemini';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Standardized Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      service: 'ilmhub-api',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Executor Health Check
  app.get('/api/health/executor', (req, res) => {
    res.json({
      ok: true,
      executor: 'pyodide-webassembly',
      remoteExecutorConfigured: Boolean(process.env.PYTHON_EXECUTOR_URL),
    });
  });

  // In-memory queue for interactive stdin / input() synchronization between worker and UI
  const pendingInputRequests = new Map<
    string,
    {
      resolve: (value: string) => void;
      prompt: string;
      processId: string;
      timeout: NodeJS.Timeout;
    }
  >();

  // Worker calls this synchronously when Python's input() is called
  app.get('/api/worker-input/wait', (req, res) => {
    const requestId =
      (req.query.requestId as string) ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const prompt = (req.query.prompt as string) || '';
    const processId = (req.query.processId as string) || 'default';

    const timeout = setTimeout(() => {
      if (pendingInputRequests.has(requestId)) {
        pendingInputRequests.delete(requestId);
        res.json({ success: false, value: '', timedOut: true });
      }
    }, 180000); // 3 minute timeout for user typing

    pendingInputRequests.set(requestId, {
      resolve: (value: string) => {
        clearTimeout(timeout);
        res.json({ success: true, value, timedOut: false });
      },
      prompt,
      processId,
      timeout,
    });
  });

  // Main UI submits user's response to an input() prompt
  app.post('/api/worker-input/provide', (req, res) => {
    const { requestId, value, processId } = req.body;

    if (requestId && pendingInputRequests.has(requestId)) {
      const item = pendingInputRequests.get(requestId)!;
      pendingInputRequests.delete(requestId);
      item.resolve(value ?? '');
      res.json({ success: true });
      return;
    }

    // If no specific requestId provided, resolve the oldest pending request for this processId
    if (processId) {
      for (const [id, item] of pendingInputRequests.entries()) {
        if (item.processId === processId) {
          pendingInputRequests.delete(id);
          item.resolve(value ?? '');
          res.json({ success: true, requestId: id });
          return;
        }
      }
    }

    // Fallback: resolve any pending request
    const firstEntry = pendingInputRequests.entries().next().value;
    if (firstEntry) {
      const [id, item] = firstEntry;
      pendingInputRequests.delete(id);
      item.resolve(value ?? '');
      res.json({ success: true, requestId: id });
      return;
    }

    res.json({ success: false, message: 'No pending input request found' });
  });

  // Cancel any pending input requests for a process
  app.post('/api/worker-input/cancel', (req, res) => {
    const { processId } = req.body;
    for (const [id, item] of pendingInputRequests.entries()) {
      if (!processId || item.processId === processId) {
        clearTimeout(item.timeout);
        item.resolve('');
        pendingInputRequests.delete(id);
      }
    }
    res.json({ success: true });
  });

  // Standardized API Execution endpoint
  app.post('/api/execute', async (req, res) => {
    try {
      const { code, stdin, timeoutMs, fileName, files } = req.body;

      if (typeof code !== 'string') {
        res.status(400).json({
          success: false,
          status: 'error',
          errorType: 'ValidationError',
          message: 'Field "code" must be a string',
          stdout: '',
          stderr: 'Field "code" must be a string',
          exitCode: 1,
          durationMs: 0,
        });
        return;
      }

      // If remote executor URL is provided, safely proxy to it
      if (process.env.PYTHON_EXECUTOR_URL) {
        try {
          const remoteResp = await fetch(`${process.env.PYTHON_EXECUTOR_URL}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, stdin, timeoutMs, fileName, files }),
          });
          const remoteData = await remoteResp.json();
          res.json(remoteData);
          return;
        } catch (proxyErr: any) {
          console.warn('Proxy to remote executor failed:', proxyErr.message);
        }
      }

      // Default response indicates Pyodide WebAssembly runtime handles execution client-side
      res.json({
        success: true,
        status: 'webassembly-runtime',
        stdout: '',
        stderr: '',
        exitCode: 0,
        durationMs: 0,
        message: 'Browser WebAssembly worker handles execution directly.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        status: 'error',
        errorType: 'ServerError',
        message: error?.message || 'Server error',
        stdout: '',
        stderr: error?.message || 'Execution error',
        exitCode: 1,
        durationMs: 0,
      });
    }
  });

  // Legacy run endpoint for backward compatibility
  app.post('/api/run', (req, res) => {
    res.json({
      success: true,
      status: 'webassembly-runtime',
      stdout: '',
      stderr: '',
      exit_code: 0,
      execution_time: 0,
      error: null,
      message: 'Browser Pyodide WebAssembly worker executes Python in sandbox',
    });
  });

  // Stop running execution
  app.post('/api/stop', (req, res) => {
    res.json({ success: true, stopped: true });
  });

  // AI Explain
  app.post('/api/ai/explain', async (req, res) => {
    try {
      const { code, selectedCode, language } = req.body;
      const explanation = await explainPythonCode({ code, selectedCode, language });
      res.json({ success: true, data: explanation });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // AI Fix
  app.post('/api/ai/fix', async (req, res) => {
    try {
      const { code, error, language } = req.body;
      const fixResult = await fixPythonError({ code, error: error || {}, language });
      res.json({ success: true, data: fixResult });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // AI Generate
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { prompt, language } = req.body;
      const genResult = await generatePythonCode({ prompt, language });
      res.json({ success: true, data: genResult });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // AI Review
  app.post('/api/ai/review', async (req, res) => {
    try {
      const { code, language } = req.body;
      const reviewResult = await reviewPythonCode({ code, language });
      res.json({ success: true, data: reviewResult });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // AI Chat
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { messages, currentCode, currentError, language, model, thinking, searchGrounding } = req.body;
      const chatResult = await chatWithAI({
        messages: Array.isArray(messages) ? messages : [],
        currentCode,
        currentError,
        language,
        model,
        thinking,
        searchGrounding,
      });
      res.json({ success: true, data: chatResult });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ILMHUB server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ILMHUB server:', err);
  process.exit(1);
});
