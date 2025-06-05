import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeCode } from '../src/claude-code';
import * as execa from 'execa';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

vi.mock('execa');

describe('Streaming functionality (NEW for streaming PR)', () => {
  let claude: ClaudeCode;
  let mockChildProcess: any;

  beforeEach(() => {
    claude = new ClaudeCode();
    
    // Create a mock child process
    mockChildProcess = new EventEmitter();
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockChildProcess.kill = vi.fn();
    
    // Mock execa to return our mock child process
    vi.mocked(execa).mockReturnValue(mockChildProcess as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle streaming chat requests', async () => {
    const tokens: string[] = [];
    let completed = false;
    
    const responsePromise = claude.chat({
      prompt: 'Hello',
      stream: true,
      onToken: (token) => tokens.push(token),
      onComplete: () => { completed = true; }
    });

    const response = await responsePromise;
    expect(response).toHaveProperty('on');
    expect(response).toHaveProperty('abort');
    expect(response).toHaveProperty('result');

    // Simulate streaming data
    mockChildProcess.stdout.emit('data', Buffer.from('{"text": "Hello "}\n'));
    mockChildProcess.stdout.emit('data', Buffer.from('{"text": "world!"}\n'));
    mockChildProcess.stdout.emit('data', Buffer.from('{"type": "result", "subtype": "success", "result": "Hello world!", "session_id": "test-123"}\n'));
    
    // Simulate process exit
    mockChildProcess.emit('exit', 0);

    // Wait for the result
    const result = await response.result;
    
    expect(tokens).toEqual(['Hello ', 'world!']);
    expect(completed).toBe(true);
    expect(result).toBe('Hello world!');
    expect(response.sessionId).toBe('test-123');
  });

  it('should handle streaming errors', async () => {
    let errorReceived: Error | null = null;
    
    const responsePromise = claude.chat({
      prompt: 'Hello',
      stream: true,
      onError: (error) => { errorReceived = error; }
    });

    const response = await responsePromise;

    // Simulate error
    mockChildProcess.stderr.emit('data', Buffer.from('API Error'));
    mockChildProcess.emit('exit', 1);

    // Wait for the error
    await expect(response.result).rejects.toThrow('Claude CLI exited with code 1');
    expect(errorReceived).toBeTruthy();
  });

  it('should support aborting streams', async () => {
    const response = await claude.chat({
      prompt: 'Hello',
      stream: true
    });

    // Abort the stream
    response.abort();
    
    expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');

    // Simulate process exit after abort
    mockChildProcess.emit('exit', 0);

    await expect(response.result).rejects.toThrow('Stream aborted by user');
  });

  it('should handle debug events in verbose mode', async () => {
    const verboseClaude = new ClaudeCode({ verbose: true });
    const debugEvents: any[] = [];
    
    const response = await verboseClaude.chat({
      prompt: 'Hello',
      stream: true
    });

    response.on('debug', (event) => {
      debugEvents.push(event);
    });

    // Simulate debug event
    mockChildProcess.stdout.emit('data', Buffer.from('{"type": "debug", "message": "Processing"}\n'));
    mockChildProcess.emit('exit', 0);

    await response.result;
    
    expect(debugEvents).toHaveLength(1);
    expect(debugEvents[0]).toEqual({ type: 'debug', message: 'Processing' });
  });
});