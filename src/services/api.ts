import { ApiClient } from '../lib/api';
import {
  ExecutionRequest,
  ExecutionResponse,
  AIFixResponse,
  AIExplainResponse,
  AIGenerateResponse,
  AIReviewResponse,
  AppLanguage,
} from '../types';

export class ApiService {
  static async healthCheck() {
    return ApiClient.healthCheck();
  }

  static async executorHealth() {
    return ApiClient.executorHealth();
  }

  static async runCode(req: ExecutionRequest, lang: AppLanguage = 'en'): Promise<ExecutionResponse> {
    return ApiClient.executePython(req, lang);
  }

  static async stopExecution(processId?: string): Promise<boolean> {
    return ApiClient.stopExecution(processId);
  }

  static async explainCode(
    code: string,
    selectedCode?: string,
    language: AppLanguage = 'en'
  ): Promise<AIExplainResponse> {
    return ApiClient.explainCode(code, selectedCode, language);
  }

  static async fixError(
    code: string,
    error: any,
    language: AppLanguage = 'en'
  ): Promise<AIFixResponse> {
    return ApiClient.fixError(code, error, language);
  }

  static async generateCode(
    prompt: string,
    language: AppLanguage = 'en'
  ): Promise<AIGenerateResponse> {
    return ApiClient.generateCode(prompt, language);
  }

  static async reviewCode(
    code: string,
    language: AppLanguage = 'en'
  ): Promise<AIReviewResponse> {
    return ApiClient.reviewCode(code, language);
  }

  static async sendChatMessage(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    currentCode: string,
    currentError?: string,
    language: AppLanguage = 'en',
    model = 'gemini-3.5-flash',
    thinking = false,
    searchGrounding = false
  ) {
    return ApiClient.sendChatMessage(
      messages,
      currentCode,
      currentError,
      language,
      model,
      thinking,
      searchGrounding
    );
  }
}
