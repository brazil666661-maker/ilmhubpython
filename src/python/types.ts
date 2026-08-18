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

export interface WorkerInputResponsePayload {
  requestId?: string;
  processId?: string;
  value?: string;
}

export interface WorkerInMessage {
  type: 'RUN' | 'INIT' | 'CANCEL' | 'INPUT_RESPONSE';
  payload?: PyodideRunOptions | WorkerInputResponsePayload;
  id?: string;
}

export interface WorkerOutMessage {
  type:
    | 'READY'
    | 'STDOUT'
    | 'STDERR'
    | 'INPUT_REQUEST'
    | 'INPUT_RESOLVED'
    | 'RUNTIME_INFO'
    | 'RESULT'
    | 'ERROR';
  id?: string;
  payload?: any;
}
