import {
  ClaudeCodeMessage,
  ClaudeCodeOptions,
  ClaudeCodeResponse,
  CommandOptions,
  PromptInput,
} from './types';
import { executeCommand } from './commands';
import { Session } from './session';
import { attemptRefreshToken } from './token';

export class ClaudeCode {
  private options: ClaudeCodeOptions;

  constructor(options: ClaudeCodeOptions = {}) {
    this.options = {
      claudeCodePath: 'claude',
      workingDirectory: process.cwd(),
      verbose: false,
      ...options,
    };
  }

  private defaultArgs(): string[] {
    const args = [this.options.claudeCodePath ?? 'claude'];
    args.push('--output-format', 'json');
    if (this.options.apiKey) {
      args.push('--api-key', this.options.apiKey);
    }
    if (this.options.model) {
      args.push('--model', this.options.model);
    }

    return args;
  }

  async chat(
    prompt: PromptInput,
    sessionId: string | undefined = undefined
  ): Promise<ClaudeCodeResponse> {
    const args = this.defaultArgs();

    args.push('-p');

    if (typeof prompt === 'string') {
      args.push(prompt);
    } else {
      args.push(`"${prompt.prompt}"`);

      if (prompt.systemPrompt) {
        args.push('--system-prompt');
        args.push(`"${prompt.systemPrompt}"`);
      }

      if (prompt.appendSystemPrompt) {
        args.push('--append-system-prompt');
        args.push(`"${prompt.appendSystemPrompt}"`);
      }
    }

    if (sessionId) {
      args.push('--resume', sessionId);
    }

    return this.runCommand(args, { cwd: this.options.workingDirectory });
  }

  private buildMessage(result: { stdout: string; stderr: string; exitCode: number }) {
    let message: ClaudeCodeMessage | undefined = undefined;
    if (result.stdout) {
      const stdoutJson = JSON.parse(result.stdout);
      if (Array.isArray(stdoutJson)) {
        message = stdoutJson.at(-1) as ClaudeCodeMessage;
      } else {
        message = stdoutJson as ClaudeCodeMessage;
      }
    }
    return message;
  }

  async version(): Promise<string> {
    const result = await executeCommand(['claude', '--version']);
    return result.stdout.trim();
  }

  setOptions(options: Partial<ClaudeCodeOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getOptions(): ClaudeCodeOptions {
    return { ...this.options };
  }

  newSession(): Session {
    return new Session(this);
  }

  private async runCommand(
    command: string[],
    options: CommandOptions,
    refreshToken: boolean = true
  ): Promise<ClaudeCodeResponse> {
    const result = await executeCommand(command, options);

    const message = this.buildMessage(result);

    if (refreshToken && message?.is_error && message?.result?.includes('Invalid bearer token')) {
      console.log('Invalid bearer token, refreshing...');
      const refreshSuccessful = await attemptRefreshToken();
      if (refreshSuccessful) {
        return this.runCommand(command, options, false);
      }
    }

    return {
      success: result.exitCode === 0,
      message: result.exitCode === 0 ? message : undefined,
      error: result.exitCode !== 0 ? message : undefined,
      exitCode: result.exitCode,
    };
  }
}
