export interface ClaudeCodeOptions {
  apiKey?: string;
  model?: string;
  workingDirectory?: string;
  verbose?: boolean;
}

export interface ClaudeCodeResponse {
  success: boolean;
  data?: any;
  error?: ClaudeCodeError;
  stdout?: string;
  stderr?: string;
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

export interface Session {
  success: boolean;
  data?: any;
  error?: ClaudeCodeError;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}