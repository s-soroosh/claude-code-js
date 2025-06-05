import {
  ClaudeCodeMessage,
  ClaudeCodeOptions,
  ClaudeCodeResponse,
  ClaudeResponse,
  CommandOptions,
  PromptInput,
  PromptInputWithStreaming,
  StreamingResponse,
  PromptWithStreaming,
} from './types';
import { executeCommand } from './commands';
import { Session } from './session';
import { attemptRefreshToken } from './token';
import { EventEmitter } from 'events';
import { execa } from 'execa';

export class ClaudeCode {
  private options: ClaudeCodeOptions;

  constructor(options: ClaudeCodeOptions = {}) {
    this.options = {
      claudeCodePath: 'claude',
      workingDirectory: process.cwd(),
      verbose: false,
      dangerouslySkipPermissions: false,
      ...options,
    };
  }

  private defaultArgs(): string[] {
    const args = [];
    args.push('--output-format', 'json');
    // API key is handled via environment variable, not CLI flag
    if (this.options.model) {
      args.push('--model', this.options.model);
    }
    // Add dangerous skip permissions flag if enabled
    if (this.options.dangerouslySkipPermissions) {
      args.push('--dangerously-skip-permissions');
    }

    return args;
  }

  async chat(
    prompt: PromptInputWithStreaming,
    sessionId: string | undefined = undefined
  ): Promise<ClaudeResponse> {
    // Check if streaming is requested
    if (typeof prompt !== 'string' && 'stream' in prompt && prompt.stream) {
      return this._streamChat(prompt as PromptWithStreaming, sessionId);
    }
    
    // Use existing non-streaming implementation
    return this._executeChat(prompt, sessionId);
  }

  private async _executeChat(
    prompt: PromptInput,
    sessionId: string | undefined = undefined
  ): Promise<ClaudeCodeResponse> {
    const args = this.defaultArgs();

    args.push('--print');

    if (typeof prompt === 'string') {
      args.push(prompt);
    } else {
      args.push(prompt.prompt);

      if (prompt.systemPrompt) {
        args.push('--system-prompt');
        args.push(prompt.systemPrompt);
      }

      if (prompt.appendSystemPrompt) {
        args.push('--append-system-prompt');
        args.push(prompt.appendSystemPrompt);
      }
    }

    if (sessionId) {
      args.push('--resume', sessionId);
    }

    // Debug logging
    if (this.options.verbose) {
      console.log('ClaudeCode._executeChat - command args:', args);
    }

    // Add the claude command to the beginning
    const fullCommand = [this.options.claudeCodePath ?? 'claude', ...args];
    return this.runCommand(fullCommand, { cwd: this.options.workingDirectory });
  }

  private async _streamChat(
    prompt: PromptWithStreaming,
    sessionId: string | undefined = undefined
  ): Promise<StreamingResponse> {
    const emitter = new EventEmitter() as StreamingResponse;
    let fullResponse = '';
    let responseSessionId: string | undefined;
    let isAborted = false;

    // Build CLI arguments
    const args = this.defaultArgs();
    // Override output format for streaming
    const streamFormatIndex = args.indexOf('--output-format');
    if (streamFormatIndex !== -1) {
      args[streamFormatIndex + 1] = 'stream-json';
    } else {
      args.push('--output-format', 'stream-json');
    }
    
    // Add verbose flag which is required for stream-json format
    if (!args.includes('--verbose')) {
      args.push('--verbose');
    }

    args.push('--print');  // Use --print for streaming format

    args.push(prompt.prompt);

    if (prompt.systemPrompt) {
      args.push('--system-prompt');
      args.push(prompt.systemPrompt);
    }

    if (prompt.appendSystemPrompt) {
      args.push('--append-system-prompt');
      args.push(prompt.appendSystemPrompt);
    }

    if (sessionId) {
      args.push('--resume', sessionId);
    }

    // Prepare environment
    const env = { ...process.env };
    if (this.options.apiKey) {
      env.ANTHROPIC_API_KEY = this.options.apiKey;
    }

    // Debug logging for streaming
    if (this.options.verbose) {
      console.log('ClaudeCode._streamChat - command args:', args);
    }

    // Start the process
    const childProcess = execa(this.options.claudeCodePath ?? 'claude', args, {
      cwd: this.options.workingDirectory || process.cwd(),
      env: {
        ...env,
        CI: 'true',  // Prevent interactive mode
        TERM: 'dumb', // Indicate non-interactive terminal
        NO_COLOR: '1' // Disable color output
      },
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe'
    });

    // Handle stdout streaming
    let buffer = '';
    childProcess.stdout?.on('data', (chunk: Buffer) => {
      if (isAborted) return;
      
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            this._handleStreamEvent(parsed, {
              emitter,
              fullResponse,
              responseSessionId,
              onToken: prompt.onToken,
              onComplete: prompt.onComplete,
              onError: prompt.onError
            });
            
            // Update references based on event
            if (parsed.type === 'result' && parsed.session_id) {
              responseSessionId = parsed.session_id;
            } else if (parsed.type === 'content' || parsed.type === 'token' || parsed.text) {
              const token = parsed.text || parsed.content || '';
              fullResponse += token;
            }
          } catch (e) {
            // Ignore JSON parse errors for non-JSON lines
            if (this.options.verbose) {
              console.debug('Non-JSON output:', line);
            }
          }
        }
      }
    });

    // Handle stderr
    let errorBuffer = '';
    childProcess.stderr?.on('data', (chunk: Buffer) => {
      errorBuffer += chunk.toString();
    });

    // Create result promise
    emitter.result = new Promise((resolve, reject) => {
      childProcess.on('exit', (code: number | null) => {
        if (this.options.verbose) {
          console.log('ClaudeCode._streamChat - Process exited:', {
            code,
            isAborted,
            fullResponseLength: fullResponse.length,
            errorBuffer: errorBuffer || '(empty)'
          });
        }
        
        if (isAborted) {
          reject(new Error('Stream aborted by user'));
          return;
        }
        
        if (code !== 0) {
          const error = new Error(`Claude CLI exited with code ${code}: ${errorBuffer}`);
          emitter.emit('error', error);
          prompt.onError?.(error);
          reject(error);
        } else {
          emitter.emit('complete', fullResponse);
          prompt.onComplete?.(fullResponse);
          resolve(fullResponse);
        }
      });

      childProcess.on('error', (error: Error) => {
        emitter.emit('error', error);
        prompt.onError?.(error);
        reject(error);
      });
    });

    // Add abort capability
    emitter.abort = () => {
      isAborted = true;
      childProcess.kill('SIGTERM');
      emitter.emit('aborted');
    };

    // Store session ID if available
    emitter.sessionId = responseSessionId;

    return emitter;
  }

  private _handleStreamEvent(event: any, context: any): void {
    const { emitter, onToken, onComplete, onError } = context;

    // Handle different event types from the stream
    if (event.type === 'result' && event.subtype === 'success') {
      // This is the final result
      emitter.emit('complete', event.result);
      onComplete?.(event.result);
      emitter.sessionId = event.session_id;
    } else if (event.text) {
      // Token event
      emitter.emit('token', event.text);
      onToken?.(event.text);
    } else if (event.type === 'error' || (event.type === 'result' && event.is_error)) {
      const error = new Error(event.result || event.message || 'Unknown streaming error');
      emitter.emit('error', error);
      onError?.(error);
    } else if (event.type === 'session') {
      emitter.emit('session', event.session_id);
      context.responseSessionId = event.session_id;
    } else {
      if (this.options.verbose) {
        emitter.emit('debug', event);
      }
    }
  }

  private buildMessage(result: { stdout: string; stderr: string; exitCode: number }) {
    let message: ClaudeCodeMessage | undefined = undefined;
    if (result.stdout) {
      try {
        const stdoutJson = JSON.parse(result.stdout);
        if (Array.isArray(stdoutJson)) {
          message = stdoutJson.at(-1) as ClaudeCodeMessage;
        } else {
          message = stdoutJson as ClaudeCodeMessage;
        }
        if (this.options.verbose) {
          console.log('ClaudeCode.buildMessage - Parsed message type:', message?.type);
        }
      } catch (error: any) {
        console.error('ClaudeCode.buildMessage - Failed to parse JSON:', error.message);
        console.error('ClaudeCode.buildMessage - Raw stdout was:', result.stdout);
      }
    } else if (this.options.verbose) {
      console.log('ClaudeCode.buildMessage - No stdout to parse');
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
    if (this.options.verbose) {
      console.log('ClaudeCode.runCommand - Full command:', command.join(' '));
      console.log('ClaudeCode.runCommand - Working directory:', options.cwd || process.cwd());
    }

    // Ensure API key is passed via environment variable
    const env = { ...process.env };
    if (this.options.apiKey) {
      env.ANTHROPIC_API_KEY = this.options.apiKey;
    }
    
    let result;
    try {
      result = await executeCommand(command, { ...options, env });
      if (this.options.verbose) {
        console.log('ClaudeCode.runCommand - Exit code:', result.exitCode);
        console.log('ClaudeCode.runCommand - Stdout length:', result.stdout?.length);
        console.log('ClaudeCode.runCommand - Stderr:', result.stderr || '(empty)');
      }
    } catch (error: any) {
      console.error('ClaudeCode.runCommand - Error executing command:', error.message);
      console.error('ClaudeCode.runCommand - Command was:', command.join(' '));
      throw error;
    }

    const message = this.buildMessage(result);

    if (
      refreshToken &&
      message?.is_error &&
      (message?.result?.includes('Invalid bearer token') || message?.result?.includes('OAuth'))
    ) {
      console.log('Invalid bearer token, refreshing...');
      const refreshSuccessful = await attemptRefreshToken(this.options.oauth);
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
