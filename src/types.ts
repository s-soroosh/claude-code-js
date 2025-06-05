export interface ClaudeCodeOptions {
  claudeCodePath?: string;
  apiKey?: string;
  model?: string;
  workingDirectory?: string;
  verbose?: boolean;
  dangerouslySkipPermissions?: boolean;
  oauth?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }
}

export interface ClaudeCodeMessage {
  type: 'result';
  subtype: 'success';
  cost_usd: number;
  duration_ms: number;
  duration_api_ms: number;
  is_error: boolean;
  num_turns: number;
  result: string;
  session_id: string;
}

export interface ClaudeCodeResponse {
  success: boolean;
  message?: ClaudeCodeMessage;
  error?: ClaudeCodeMessage;
  exitCode?: number;
}

export interface ClaudeCodeError {
  code: string;
  message: string;
  details?: any;
}

export interface CommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
  shell?: boolean;
}

export interface Prompt {
  prompt: string;
  systemPrompt?: string;
  appendSystemPrompt?: string;
}

export type PromptInput = Prompt | string;

export interface OAuthCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Streaming types
export interface StreamingOptions {
  onToken?: (token: string) => void;
  onComplete?: (result: string) => void;
  onError?: (error: Error) => void;
}

export interface PromptWithStreaming extends Prompt, StreamingOptions {
  stream: true;
}

export type PromptInputWithStreaming = PromptInput | PromptWithStreaming;

export interface StreamingResponse extends NodeJS.EventEmitter {
  result: Promise<string>;
  abort: () => void;
  sessionId?: string;
}

export type ClaudeResponse = ClaudeCodeResponse | StreamingResponse;