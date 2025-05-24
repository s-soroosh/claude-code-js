import { type ExecaError } from 'execa';
import { ClaudeCodeOptions, ClaudeCodeResponse, Prompt, Session } from './types';
import { executeCommand } from './commands';

export class ClaudeCode {
  private options: ClaudeCodeOptions;

  constructor(options: ClaudeCodeOptions = {}) {
    this.options = {
      workingDirectory: process.cwd(),
      verbose: false,
      ...options,
    };
  }

  private defaultArgs(): string[] {
    const args = ['claude'];
    if (this.options.apiKey) {
      args.push('--api-key', this.options.apiKey);
    }
    if (this.options.model) {
      args.push('--model', this.options.model);
    }

    return args;
  }

  async chat(message: string): Promise<ClaudeCodeResponse> {
    try {
      const args = this.defaultArgs();

      args.push('-p');
      args.push(`"${message}"`);

      const result = await executeCommand(args, {
        cwd: this.options.workingDirectory,
      });

      return {
        success: true,
        data: result.stdout,
        stdout: result.stdout,
        stderr: result.stderr,
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
        stdout: String(execaError.stdout ?? ''),
        stderr: String(execaError.stderr ?? ''),
        exitCode: execaError.exitCode,
      };
    }
  }

  async runCommand(command: string): Promise<ClaudeCodeResponse> {
    try {
      const args = this.defaultArgs();

      args.push('-p');
      args.push(`"${command}"`);

      const result = await executeCommand(args, {
        cwd: this.options.workingDirectory,
      });

      return {
        success: true,
        data: result.stdout,
        stdout: result.stdout,
        stderr: result.stderr,
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
        stdout: String(execaError.stdout ?? ''),
        stderr: String(execaError.stderr ?? ''),
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

  async newSession(prompt: Prompt): Promise<Session> {
    try {
      const args = this.defaultArgs();
      args.push('-p');
      args.push(`"${prompt.prompt}"`);

      if (prompt.systemPrompt) {
        args.push('--system-prompt');
        args.push(`"${prompt.systemPrompt}"`);
      }

      if (prompt.appendSystemPrompt) {
        args.push('--append-system-prompt');
        args.push(`"${prompt.appendSystemPrompt}"`);
      }

      const result = await executeCommand(args, {
        cwd: this.options.workingDirectory,
      });

      return {
        success: true,
        data: result.stdout,
        stdout: result.stdout,
        stderr: result.stderr,
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
        stdout: String(execaError.stdout ?? ''),
        stderr: String(execaError.stderr ?? ''),
        exitCode: execaError.exitCode,
      };
    }
  }
}
