export interface PyodideRunOptions {
  code: string;
  filename?: string;
  files?: Array<{ name: string; content: string }>;
  stdin?: string;
  timeoutMs?: number;
  maxOutputSize?: number;
  processId?: string;
  lang?: 'en' | 'uz' | 'ru' | 'uz-cyrl';
}

export interface WorkerInMessage {
  type: 'RUN' | 'INIT' | 'CANCEL';
  payload?: PyodideRunOptions;
  id?: string;
}

export interface WorkerOutMessage {
  type: 'READY' | 'STDOUT' | 'STDERR' | 'RESULT' | 'ERROR';
  id?: string;
  payload?: any;
}
