import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { Session } from '../src/session';
import { ClaudeCode, ClaudeCodeResponse } from '../src';
import { ClaudeCodeMessage } from '../src/types';

describe('Session', () => {
  let mockClaudeCode: ClaudeCode;
  let mockInitialMessage: ClaudeCodeMessage;

  beforeEach(() => {
    mockClaudeCode = {
      chat: vi.fn(),
    } as unknown as ClaudeCode;

    mockInitialMessage = {
      type: 'result',
      subtype: 'success',
      cost_usd: 0.001,
      duration_ms: 1000,
      duration_api_ms: 800,
      is_error: false,
      num_turns: 1,
      result: 'Initial response',
      session_id: 'session-123',
    };
  });

  describe('constructor', () => {
    it('should initialize with ClaudeCode instance and initial message', () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);

      expect(session.messages).toHaveLength(1);
      expect(session.messages[0]).toEqual(mockInitialMessage);
      expect(session.sessionIds).toHaveLength(1);
      expect(session.sessionIds[0]).toBe('session-123');
    });

    it('should store the initial message in messages array', () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);

      expect(session.messages[0]).toBe(mockInitialMessage);
      expect(session.messages[0].result).toBe('Initial response');
      expect(session.messages[0].session_id).toBe('session-123');
    });

    it('should store the initial session ID in sessionIds array', () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);

      expect(session.sessionIds[0]).toBe('session-123');
    });
  });

  describe('prompt', () => {
    it('should send prompt with the latest session ID', async () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);
      const mockResponse: ClaudeCodeResponse = {
        success: true,
        message: {
          type: 'result',
          subtype: 'success',
          cost_usd: 0.002,
          duration_ms: 1500,
          duration_api_ms: 1200,
          is_error: false,
          num_turns: 2,
          result: 'Second response',
          session_id: 'session-456',
        },
      };

      (mockClaudeCode.chat as Mock).mockResolvedValueOnce(mockResponse);

      const result = await session.prompt({ prompt: 'Follow up question' });

      expect(mockClaudeCode.chat).toHaveBeenCalledWith(
        { prompt: 'Follow up question' },
        'session-123'
      );
      expect(result).toEqual(mockResponse.message);
    });

    it('should append new message to messages array', async () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);
      const secondMessage: ClaudeCodeMessage = {
        type: 'result',
        subtype: 'success',
        cost_usd: 0.002,
        duration_ms: 1500,
        duration_api_ms: 1200,
        is_error: false,
        num_turns: 2,
        result: 'Second response',
        session_id: 'session-456',
      };

      (mockClaudeCode.chat as Mock).mockResolvedValueOnce({
        success: true,
        message: secondMessage,
      });

      await session.prompt({ prompt: 'Follow up question' });

      expect(session.messages).toHaveLength(2);
      expect(session.messages[1]).toEqual(secondMessage);
    });

    it('should append new session ID to sessionIds array', async () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);
      const secondMessage: ClaudeCodeMessage = {
        type: 'result',
        subtype: 'success',
        cost_usd: 0.002,
        duration_ms: 1500,
        duration_api_ms: 1200,
        is_error: false,
        num_turns: 2,
        result: 'Second response',
        session_id: 'session-456',
      };

      (mockClaudeCode.chat as Mock).mockResolvedValueOnce({
        success: true,
        message: secondMessage,
      });

      await session.prompt({ prompt: 'Follow up question' });

      expect(session.sessionIds).toHaveLength(2);
      expect(session.sessionIds[1]).toBe('session-456');
    });

    it('should handle multiple prompts and maintain conversation history', async () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);

      const messages = [
        {
          type: 'result' as const,
          subtype: 'success' as const,
          cost_usd: 0.002,
          duration_ms: 1500,
          duration_api_ms: 1200,
          is_error: false,
          num_turns: 2,
          result: 'Second response',
          session_id: 'session-456',
        },
        {
          type: 'result' as const,
          subtype: 'success' as const,
          cost_usd: 0.003,
          duration_ms: 2000,
          duration_api_ms: 1600,
          is_error: false,
          num_turns: 3,
          result: 'Third response',
          session_id: 'session-789',
        },
      ];

      (mockClaudeCode.chat as Mock)
        .mockResolvedValueOnce({ success: true, message: messages[0] })
        .mockResolvedValueOnce({ success: true, message: messages[1] });

      await session.prompt({ prompt: 'Second question' });
      await session.prompt({ prompt: 'Third question' });

      expect(session.messages).toHaveLength(3);
      expect(session.sessionIds).toHaveLength(3);
      expect(session.sessionIds).toEqual(['session-123', 'session-456', 'session-789']);

      // Verify the second prompt used the session ID from the first response
      expect(mockClaudeCode.chat).toHaveBeenNthCalledWith(
        2,
        { prompt: 'Third question' },
        'session-456'
      );
    });

    it('should throw error when no message is returned', async () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (mockClaudeCode.chat as Mock).mockResolvedValueOnce({
        success: false,
        error: { code: 'ERROR_CODE', message: 'Something went wrong' },
      });

      await expect(session.prompt({ prompt: 'This will fail' })).rejects.toThrow(
        'No message returned from Claude'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in the prompt:', {
        error: { code: 'ERROR_CODE', message: 'Something went wrong' },
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle prompt with system prompt', async () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);
      const mockResponse: ClaudeCodeResponse = {
        success: true,
        message: {
          type: 'result',
          subtype: 'success',
          cost_usd: 0.002,
          duration_ms: 1500,
          duration_api_ms: 1200,
          is_error: false,
          num_turns: 2,
          result: 'Response with system prompt',
          session_id: 'session-456',
        },
      };

      (mockClaudeCode.chat as Mock).mockResolvedValueOnce(mockResponse);

      await session.prompt({
        prompt: 'Question',
        systemPrompt: 'You are a helpful assistant',
        appendSystemPrompt: 'Be concise',
      });

      expect(mockClaudeCode.chat).toHaveBeenCalledWith(
        {
          prompt: 'Question',
          systemPrompt: 'You are a helpful assistant',
          appendSystemPrompt: 'Be concise',
        },
        'session-123'
      );
    });

    it('should use the latest session ID from multiple sessions', async () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);

      // Add multiple session IDs by simulating multiple prompts
      const responses = ['session-456', 'session-789', 'session-abc'].map((id, index) => ({
        success: true,
        message: {
          type: 'result' as const,
          subtype: 'success' as const,
          cost_usd: 0.001 * (index + 2),
          duration_ms: 1000 * (index + 2),
          duration_api_ms: 800 * (index + 2),
          is_error: false,
          num_turns: index + 2,
          result: `Response ${index + 2}`,
          session_id: id,
        },
      }));

      for (const response of responses) {
        (mockClaudeCode.chat as Mock).mockResolvedValueOnce(response);
        await session.prompt({ prompt: `Question ${response.message.num_turns}` });
      }

      // Now test that the next prompt uses the latest session ID
      (mockClaudeCode.chat as Mock).mockResolvedValueOnce({
        success: true,
        message: {
          type: 'result',
          subtype: 'success',
          cost_usd: 0.005,
          duration_ms: 5000,
          duration_api_ms: 4000,
          is_error: false,
          num_turns: 5,
          result: 'Final response',
          session_id: 'session-final',
        },
      });

      await session.prompt({ prompt: 'Final question' });

      // The last call should use 'session-abc' which is the latest session ID
      expect(mockClaudeCode.chat).toHaveBeenLastCalledWith(
        { prompt: 'Final question' },
        'session-abc'
      );
    });

    it('should return the message from successful response', async () => {
      const session = new Session(mockClaudeCode, mockInitialMessage);
      const expectedMessage: ClaudeCodeMessage = {
        type: 'result',
        subtype: 'success',
        cost_usd: 0.002,
        duration_ms: 1500,
        duration_api_ms: 1200,
        is_error: false,
        num_turns: 2,
        result: 'Expected response',
        session_id: 'session-456',
      };

      (mockClaudeCode.chat as Mock).mockResolvedValueOnce({
        success: true,
        message: expectedMessage,
      });

      const result = await session.prompt({ prompt: 'Get response' });

      expect(result).toBe(expectedMessage);
      expect(result.result).toBe('Expected response');
      expect(result.session_id).toBe('session-456');
    });
  });

  describe('fork', () => {
    it('should not change the current session', async () => {

      const mockResponse: ClaudeCodeResponse = {
        success: true,
        message: {
          type: 'result',
          subtype: 'success',
          cost_usd: 0.002,
          duration_ms: 1500,
          duration_api_ms: 1200,
          is_error: false,
          num_turns: 2,
          result: 'Second response',
          session_id: 'session-456',
        },
      };

      (mockClaudeCode.chat as Mock).mockResolvedValue(mockResponse);
      const session = new Session(mockClaudeCode, mockInitialMessage);
      await session.prompt('prompt1');
      await session.prompt('prompt2');

      const sessionMessages = session.messages;
      const sessionSessionIds = session.sessionIds;
      expect(sessionMessages).toHaveLength(3);
      expect(sessionSessionIds).toHaveLength(3);

      const forkedSession = session.fork();
      expect(session.messages).toHaveLength(3);
      expect(session.sessionIds).toHaveLength(3);

      expect(forkedSession.messages).toHaveLength(3);
      expect(forkedSession.sessionIds).toHaveLength(3);
    });
  });
});