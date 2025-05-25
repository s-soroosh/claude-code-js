export interface ClaudeCodeOptions {
  claudeCodePath?: string;
  apiKey?: string;
  model?: string;
  workingDirectory?: string;
  verbose?: boolean;
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
  error?: ClaudeCodeError;
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