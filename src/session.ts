import { ClaudeCode } from './claude-code';
import { ClaudeCodeMessage, PromptInput } from './types';

export class Session {
  private claudeCode: ClaudeCode;
  private _sessionIds: string[] = [];
  private _messages: ClaudeCodeMessage[] = [];

  get sessionIds(): string[] {
    return [...this._sessionIds];
  }

  get messages(): ClaudeCodeMessage[] {
    return [...this._messages];
  }

  public constructor(cloudCode: ClaudeCode) {
    this.claudeCode = cloudCode;
  }

  async prompt(prompt: PromptInput): Promise<ClaudeCodeMessage> {
    const response = await this.claudeCode.chat(prompt, this._sessionIds.at(-1));
    
    // Check if it's a streaming response
    if ('on' in response && 'result' in response) {
      // For streaming, we don't support sessions yet
      throw new Error('Streaming is not supported in sessions. Use claude.chat() directly for streaming.');
    }
    
    // Handle non-streaming response
    const codeResponse = response as any;
    if (codeResponse.message) {
      this._messages.push(codeResponse.message);
      this._sessionIds.push(codeResponse.message.session_id);
      return codeResponse.message;
    } else {
      console.error('Error in the prompt:', { error: codeResponse.error });
      throw new Error('No message returned from Claude');
    }
  }

  fork(): Session {
    const newSession = new Session(this.claudeCode);
    newSession._messages = this._messages;
    newSession._sessionIds = this._sessionIds;
    return newSession;
  }

  revert(count: number = 1) {
    for (let i = 0; i < count; i++) {
      this._sessionIds.pop();
      this._messages.pop();
    }
  }
}
