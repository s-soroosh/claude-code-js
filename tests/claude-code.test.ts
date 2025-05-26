import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClaudeCode } from '../src/claude-code';
import { executeCommand } from '../src/commands';
import { Session } from '../src/session';
import type { ClaudeCodeMessage, ClaudeCodeOptions, PromptInput } from '../src/types';

vi.mock('../src/commands');
vi.mock('../src/session');

describe('ClaudeCode', () => {
  const mockExecuteCommand = vi.mocked(executeCommand);
  const mockSession = vi.mocked(Session);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const claude = new ClaudeCode();
      const options = claude.getOptions();

      expect(options.claudeCodePath).toBe('claude');
      expect(options.workingDirectory).toBe(process.cwd());
      expect(options.verbose).toBe(false);
      expect(options.apiKey).toBeUndefined();
      expect(options.model).toBeUndefined();
    });

    it('should initialize with custom options', () => {
      const customOptions: ClaudeCodeOptions = {
        claudeCodePath: '~/local/claude',
        workingDirectory: '/custom/path',
        verbose: true,
        apiKey: 'test-api-key',
        model: 'claude-3-sonnet',
      };

      const claude = new ClaudeCode(customOptions);
      const options = claude.getOptions();

      expect(options).toEqual(customOptions);
    });

    it('should merge custom options with defaults', () => {
      const customOptions: ClaudeCodeOptions = {
        apiKey: 'test-api-key',
      };

      const claude = new ClaudeCode(customOptions);
      const options = claude.getOptions();

      expect(options.workingDirectory).toBe(process.cwd());
      expect(options.verbose).toBe(false);
      expect(options.apiKey).toBe('test-api-key');
    });
  });

  describe('chat', () => {
    const mockMessage: ClaudeCodeMessage = {
      type: 'result',
      subtype: 'success',
      cost_usd: 0.01,
      duration_ms: 1000,
      duration_api_ms: 800,
      is_error: false,
      num_turns: 1,
      result: 'Test response',
      session_id: 'test-session-id',
    };

    it('should handle string prompt successfully', async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: JSON.stringify(mockMessage),
        stderr: '',
        exitCode: 0,
      });

      const claude = new ClaudeCode();
      const result = await claude.chat('Hello Claude');

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        ['claude', '--output-format', 'json', '-p', 'Hello Claude'],
        { cwd: process.cwd() }
      );
      expect(result).toEqual({
        success: true,
        message: mockMessage,
        exitCode: 0,
      });
    });

    it('should handle object prompt with all fields', async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: JSON.stringify(mockMessage),
        stderr: '',
        exitCode: 0,
      });

      const prompt: PromptInput = {
        prompt: 'Main prompt',
        systemPrompt: 'System prompt',
        appendSystemPrompt: 'Append system prompt',
      };

      const claude = new ClaudeCode();
      const result = await claude.chat(prompt);

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        [
          'claude',
          '--output-format',
          'json',
          '-p',
          '"Main prompt"',
          '--system-prompt',
          '"System prompt"',
          '--append-system-prompt',
          '"Append system prompt"',
        ],
        { cwd: process.cwd() }
      );
      expect(result.success).toBe(true);
    });

    it('should handle object prompt without optional fields', async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: JSON.stringify(mockMessage),
        stderr: '',
        exitCode: 0,
      });

      const prompt: PromptInput = {
        prompt: 'Main prompt only',
      };

      const claude = new ClaudeCode();
      const result = await claude.chat(prompt);

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        ['claude', '--output-format', 'json', '-p', '"Main prompt only"'],
        { cwd: process.cwd() }
      );
      expect(result.success).toBe(true);
    });

    it('should include sessionId when provided', async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: JSON.stringify(mockMessage),
        stderr: '',
        exitCode: 0,
      });

      const claude = new ClaudeCode();
      const result = await claude.chat('Hello', 'session-123');

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        ['claude', '--output-format', 'json', '-p', 'Hello', '--resume', 'session-123'],
        { cwd: process.cwd() }
      );
      expect(result.success).toBe(true);
    });

    it('should include API key and model when set', async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: JSON.stringify(mockMessage),
        stderr: '',
        exitCode: 0,
      });

      const claude = new ClaudeCode({
        apiKey: 'test-key',
        model: 'claude-3-opus',
      });
      const result = await claude.chat('Hello');

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        [
          'claude',
          '--output-format',
          'json',
          '--api-key',
          'test-key',
          '--model',
          'claude-3-opus',
          '-p',
          'Hello',
        ],
        { cwd: process.cwd() }
      );
      expect(result.success).toBe(true);
    });

    it('should handle array response from stdout', async () => {
      const messages = [mockMessage, { ...mockMessage, result: 'Second message' }];
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: JSON.stringify(messages),
        stderr: '',
        exitCode: 0,
      });

      const claude = new ClaudeCode();
      const result = await claude.chat('Hello');

      expect(result.message).toEqual({ ...mockMessage, result: 'Second message' });
    });

    it('should handle command failure', async () => {
      const mockError = new Error('Command failed') as any;
      mockError.message = 'Command execution failed';
      mockError.exitCode = 1;
      mockExecuteCommand.mockRejectedValueOnce(mockError);

      const claude = new ClaudeCode();
      const result = await claude.chat('Hello');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'COMMAND_FAILED',
          message: 'Command execution failed',
          details: mockError,
        },
        exitCode: 1,
      });
    });

    it('should use custom working directory', async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: JSON.stringify(mockMessage),
        stderr: '',
        exitCode: 0,
      });

      const claude = new ClaudeCode({ workingDirectory: '/custom/dir' });
      await claude.chat('Hello');

      expect(mockExecuteCommand).toHaveBeenCalledWith(expect.any(Array), { cwd: '/custom/dir' });
    });
  });

  describe('runCommand', () => {
    const mockMessage: ClaudeCodeMessage = {
      type: 'result',
      subtype: 'success',
      cost_usd: 0.01,
      duration_ms: 1000,
      duration_api_ms: 800,
      is_error: false,
      num_turns: 1,
      result: 'Command executed',
      session_id: 'test-session-id',
    };

    it('should execute command successfully', async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: JSON.stringify(mockMessage),
        stderr: '',
        exitCode: 0,
      });

      const claude = new ClaudeCode();
      const result = await claude.runCommand('ls -la');

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        ['claude', '--output-format', 'json', '-p', '"ls -la"'],
        { cwd: process.cwd() }
      );
      expect(result).toEqual({
        success: true,
        message: mockMessage,
        exitCode: 0,
      });
    });

    it('should handle command failure', async () => {
      const mockError = new Error('Command failed') as any;
      mockError.message = 'Command execution failed';
      mockError.exitCode = 1;
      mockExecuteCommand.mockRejectedValueOnce(mockError);

      const claude = new ClaudeCode();
      const result = await claude.runCommand('invalid-command');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'COMMAND_FAILED',
          message: 'Command execution failed',
          details: mockError,
        },
        exitCode: 1,
      });
    });

    it('should include API key and model when set', async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: JSON.stringify(mockMessage),
        stderr: '',
        exitCode: 0,
      });

      const claude = new ClaudeCode({
        apiKey: 'test-key',
        model: 'claude-3-opus',
      });
      await claude.runCommand('echo test');

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        [
          'claude',
          '--output-format',
          'json',
          '--api-key',
          'test-key',
          '--model',
          'claude-3-opus',
          '-p',
          '"echo test"',
        ],
        { cwd: process.cwd() }
      );
    });
  });

  describe('version', () => {
    it('should return version string', async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: '  Claude CLI v1.2.3  \n',
        stderr: '',
        exitCode: 0,
      });

      const claude = new ClaudeCode();
      const version = await claude.version();

      expect(mockExecuteCommand).toHaveBeenCalledWith(['claude', '--version']);
      expect(version).toBe('Claude CLI v1.2.3');
    });
  });

  describe('setOptions and getOptions', () => {
    it('should update options partially', () => {
      const claude = new ClaudeCode({ apiKey: 'initial-key' });

      claude.setOptions({ model: 'claude-3-opus' });

      const options = claude.getOptions();
      expect(options.apiKey).toBe('initial-key');
      expect(options.model).toBe('claude-3-opus');
    });

    it('should return a copy of options', () => {
      const claude = new ClaudeCode({ apiKey: 'test-key' });
      const options1 = claude.getOptions();
      const options2 = claude.getOptions();

      expect(options1).not.toBe(options2);
      expect(options1).toEqual(options2);
    });
  });

  describe('newSession', () => {
    it('should create a new session', () => {
      const claude = new ClaudeCode();
      const session = claude.newSession();

      expect(mockSession).toHaveBeenCalledWith(claude);
      expect(session).toBeDefined();
    });

    it('should create a new session with custom options', () => {
      const claude = new ClaudeCode({
        apiKey: 'test-key',
        model: 'sonnet',
      });
      const session = claude.newSession();

      expect(mockSession).toHaveBeenCalledWith(claude);
      expect(session).toBeDefined();
    });
  });

  describe('buildMessage', () => {
    it('should handle undefined message when stdout is empty', async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0,
      });

      const claude = new ClaudeCode();
      const result = await claude.chat('Hello');

      expect(result.message).toBeUndefined();
    });
  });
});
