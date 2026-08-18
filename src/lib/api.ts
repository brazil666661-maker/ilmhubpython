import {
  ExecutionRequest,
  ExecutionResponse,
  AIFixResponse,
  AIExplainResponse,
  AIGenerateResponse,
  AIReviewResponse,
  AppLanguage,
  ParsedPythonError,
} from '../types';
import { PythonExecutor } from '../python/PythonExecutor';

export interface HealthCheckResponse {
  ok: boolean;
  service: string;
  environment: string;
  timestamp?: string;
  hasGeminiKey?: boolean;
}

export interface ExecutorHealthResponse {
  ok: boolean;
  executor: string;
  remoteExecutorConfigured: boolean;
}

export class ApiClient {
  /**
   * Health check for Vercel/Node API backend
   */
  static async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      console.warn('[ApiClient] Backend health check failed:', err?.message);
      return {
        ok: false,
        service: 'ilmhub-api',
        environment: 'client-only',
      };
    }
  }

  /**
   * Check Python execution backend health
   */
  static async executorHealth(): Promise<ExecutorHealthResponse> {
    try {
      const response = await fetch('/api/health/executor');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch {
      return {
        ok: true,
        executor: 'pyodide-webassembly',
        remoteExecutorConfigured: false,
      };
    }
  }

  /**
   * Execute Python Code using isolated Pyodide Web Worker (zero Vercel backend failure)
   */
  static async executePython(
    req: ExecutionRequest,
    lang: AppLanguage = 'en'
  ): Promise<ExecutionResponse> {
    try {
      // Execute in isolated browser Web Worker
      const result = await PythonExecutor.execute(req, lang);
      return result;
    } catch (error: any) {
      console.error('[ApiClient] Execution error:', error);
      const isTimeout = error?.message?.includes('timed out');

      return {
        success: false,
        stdout: '',
        stderr: `Execution error: ${error?.message || 'Unknown runtime error'}`,
        exit_code: isTimeout ? 124 : 1,
        execution_time: 0,
        error: {
          type: isTimeout ? 'TimeoutError' : 'RuntimeError',
          message: error?.message || 'Execution failed',
          file: req.filename || 'main.py',
          line: 1,
          traceback: error?.stack || '',
          simpleExplanation: isTimeout
            ? 'Your code took too long to run.'
            : 'An unexpected error occurred while executing the code in the WebAssembly sandbox.',
          suggestedFix: isTimeout
            ? 'Check for infinite loops or long iterations.'
            : 'Verify your Python syntax and logic.',
        },
        timed_out: isTimeout,
        cancelled: false,
        processId: req.processId,
      };
    }
  }

  /**
   * Stop/Cancel active execution
   */
  static async stopExecution(processId?: string): Promise<boolean> {
    try {
      fetch('/api/worker-input/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId }),
      }).catch(() => {});
      return PythonExecutor.cancel(processId);
    } catch (err) {
      console.error('[ApiClient] Stop error:', err);
      return false;
    }
  }

  /**
   * Submit interactive user input to waiting Python input() request
   */
  static async provideInput(value: string, requestId?: string, processId?: string): Promise<boolean> {
    return PythonExecutor.provideInput(value, requestId, processId);
  }

  /**
   * Subscribe to Python input() prompt events
   */
  static onInputRequest(listener: (event: { requestId: string; prompt: string; processId: string }) => void): () => void {
    return PythonExecutor.onInputRequest(listener);
  }

  /**
   * Subscribe to input resolved events
   */
  static onInputResolved(listener: (event: { requestId: string; value: string; processId: string }) => void): () => void {
    return PythonExecutor.onInputResolved(listener);
  }

  /**
   * AI Code Explanation via Server-side Gemini API
   */
  static async explainCode(
    code: string,
    selectedCode?: string,
    language: AppLanguage = 'en'
  ): Promise<AIExplainResponse> {
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, selectedCode, language }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Failed to explain code');
      return json.data;
    } catch (err: any) {
      console.error('[ApiClient] AI Explain error:', err);
      return {
        overview: 'Could not connect to AI service. Please ensure GEMINI_API_KEY is configured.',
        lineByLine: [],
        potentialIssues: ['AI service connection failed: ' + err?.message],
        improvements: ['Check your API key in environment variables.'],
      };
    }
  }

  /**
   * AI Error Fix via Server-side Gemini API
   */
  static async fixError(
    code: string,
    error: any,
    language: AppLanguage = 'en'
  ): Promise<AIFixResponse> {
    try {
      const response = await fetch('/api/ai/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, error, language }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Failed to fix code');
      return json.data;
    } catch (err: any) {
      console.error('[ApiClient] AI Fix error:', err);
      return {
        explanation: 'AI fixing service could not be reached: ' + (err?.message || 'Network error'),
        error_type: error?.type || 'Error',
        fixed_code: code,
        changes: ['Ensure GEMINI_API_KEY is set in Vercel environment settings.'],
      };
    }
  }

  /**
   * AI Code Generation
   */
  static async generateCode(
    prompt: string,
    language: AppLanguage = 'en'
  ): Promise<AIGenerateResponse> {
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Failed to generate code');
      return json.data;
    } catch (err: any) {
      console.error('[ApiClient] AI Generate error:', err);
      return {
        code: `# Could not generate code: ${err?.message || 'Connection error'}\n# Please check your GEMINI_API_KEY`,
        explanation: 'AI service unavailable: ' + err?.message,
        usageExample: '',
      };
    }
  }

  /**
   * AI Code Review
   */
  static async reviewCode(
    code: string,
    language: AppLanguage = 'en'
  ): Promise<AIReviewResponse> {
    try {
      const response = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Failed to review code');
      return json.data;
    } catch (err: any) {
      console.error('[ApiClient] AI Review error:', err);
      return {
        score: 0,
        summary: 'AI Review could not be completed: ' + err?.message,
        suggestions: [
          {
            issue: 'AI connection failed',
            fix: 'Ensure GEMINI_API_KEY is configured in your deployment.',
            severity: 'error',
          },
        ],
      };
    }
  }

  /**
   * AI Interactive Chat
   */
  static async sendChatMessage(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    currentCode: string,
    currentError?: string,
    language: AppLanguage = 'en',
    model = 'gemini-3.5-flash',
    thinking = false,
    searchGrounding = false
  ): Promise<{ content: string; modelUsed: string; groundingUrls: Array<{ title?: string; uri: string }> }> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          currentCode,
          currentError,
          language,
          model,
          thinking,
          searchGrounding,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Chat request failed');
      return json.data;
    } catch (err: any) {
      console.error('[ApiClient] Chat error:', err);
      return {
        content: `Could not connect to Gemini AI Assistant: ${err?.message || 'Please check your connection and GEMINI_API_KEY.'}`,
        modelUsed: model,
        groundingUrls: [],
      };
    }
  }
}
