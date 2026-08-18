export interface FileItem {
  id: string;
  name: string;
  content: string;
  isModified?: boolean;
  isMain?: boolean;
}

export interface ParsedPythonError {
  type: string;
  message: string;
  file: string;
  line: number;
  column?: number;
  source?: string;
  traceback: string;
  simpleExplanation: string;
  suggestedFix: string;
}

export interface ExecutionRequest {
  code: string;
  filename?: string;
  files?: Array<{ name: string; content: string }>;
  stdin?: string;
  timeout?: number;
  maxOutputSize?: number;
  processId?: string;
}

export interface ExecutionResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  execution_time: number;
  error: ParsedPythonError | null;
  timed_out?: boolean;
  cancelled?: boolean;
  output_truncated?: boolean;
  processId?: string;
}

export type ExecutionState =
  | 'idle'
  | 'queued'
  | 'running'
  | 'success'
  | 'error'
  | 'timeout'
  | 'cancelled';

export interface TerminalEntry {
  id: string;
  type: 'command' | 'stdout' | 'stderr' | 'system' | 'error' | 'success';
  text: string;
  timestamp: string;
}

export type AppLanguage = 'en' | 'uz' | 'ru' | 'uz-cyrl';
export type AppTheme = 'dark' | 'light' | 'system';
export type TerminalPosition = 'bottom' | 'right' | 'left';

export interface AppSettings {
  language: AppLanguage;
  theme: AppTheme;
  fontSize: number;
  editorFont: string;
  wordWrap: boolean;
  minimap: boolean;
  autosave: boolean;
  terminalPosition: TerminalPosition;
  terminalHeight: number;
  terminalWidth: number;
  terminalFontSize: number;
  clearOnRun: boolean;
  showTimestamps: boolean;
  timeoutSeconds: number;
  maxOutputSizeKB: number;
  aiModel: string;
  aiThinking: boolean;
  aiSearchGrounding: boolean;
  aiResponseLanguage: AppLanguage;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  isThinking?: boolean;
  codeSnippet?: string;
  fixedCode?: string;
  explanation?: string;
  changes?: string[];
  groundingUrls?: Array<{ title?: string; uri: string }>;
}

export interface AIFixResponse {
  explanation: string;
  error_type: string;
  fixed_code: string;
  changes: string[];
}

export interface AIExplainResponse {
  overview: string;
  lineByLine: Array<{ line: string; explanation: string }>;
  potentialIssues: string[];
  improvements: string[];
}

export interface AIGenerateResponse {
  code: string;
  explanation: string;
  usageExample?: string;
}

export interface AIReviewResponse {
  score: number;
  summary: string;
  suggestions: Array<{
    line?: number;
    issue: string;
    fix: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

export interface CodeExample {
  id: string;
  title: string;
  category: string;
  description: string;
  code: string;
  hasError?: boolean;
}
