import { type ExecaError } from 'execa';
import { ClaudeCodeMessage, ClaudeCodeOptions, ClaudeCodeResponse, PromptInput } from './types';
import { executeCommand } from './commands';
import { Session } from './session';

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
    try {
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

      const result = await executeCommand(args, {
        cwd: this.options.workingDirectory,
      });

      const message = this.buildMessage(result);

      return {
        success: true,
        message,
        exitCode: result.exitCode,
      };
    } catch (error) {
      const execaError = error as ExecaError;
      return {
        success: false,
        error: {
          code: 'COMMAND_FAILED',
          message: execaError.message,
          details: execaError,
        },
        exitCode: execaError.exitCode,
      };
    }
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

  async runCommand(command: string): Promise<ClaudeCodeResponse> {
    try {
      const args = this.defaultArgs();

      args.push('-p');
      args.push(`"${command}"`);

      const result = await executeCommand(args, {
        cwd: this.options.workingDirectory,
      });

      const message = this.buildMessage(result);

      return {
        success: true,
        message,
        exitCode: result.exitCode,
      };
    } catch (error) {
      const execaError = error as ExecaError;
      return {
        success: false,
        error: {
          code: 'COMMAND_FAILED',
          message: execaError.message,
          details: execaError,
        },
        exitCode: execaError.exitCode,
      };
    }
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
}
