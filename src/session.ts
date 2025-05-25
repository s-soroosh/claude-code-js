import { ClaudeCode } from './claude-code';
import { ClaudeCodeMessage, PromptInput } from './types';

class NullCloudCodeMessage implements ClaudeCodeMessage {
  type!: 'result';
  subtype!: 'success';
  cost_usd!: number;
  duration_ms!: number;
  duration_api_ms!: number;
  is_error!: boolean;
  num_turns!: number;
  result!: string;
  session_id!: string;
}

export class Session {
  private static nullCloudCodeMessage: NullCloudCodeMessage = new NullCloudCodeMessage();
  private claudeCode: ClaudeCode;
  private _sessionIds: string[] = [];
  private _messages: ClaudeCodeMessage[] = [];

  get sessionIds(): string[] {
    return [...this._sessionIds];
  }

  get messages(): ClaudeCodeMessage[] {
    return [...this._messages];
  }

  public constructor(cloudCode: ClaudeCode, initialMessage: ClaudeCodeMessage) {
    this.claudeCode = cloudCode;
    if (initialMessage !== Session.nullCloudCodeMessage) {
      this._messages.push(initialMessage);
      this._sessionIds.push(initialMessage.session_id);
    }
  }

  async prompt(prompt: PromptInput): Promise<ClaudeCodeMessage> {
    const response = await this.claudeCode.chat(prompt, this._sessionIds.at(-1));
    if (response.message) {
      this._messages.push(response.message);
      this._sessionIds.push(response.message.session_id);
      return response.message;
    } else {
      console.error('Error in the prompt:', { error: response.error });
      throw new Error('No message returned from Claude');
    }
  }

  fork(): Session {
    const newSession = new Session(this.claudeCode, Session.nullCloudCodeMessage);
    newSession._messages = this._messages;
    newSession._sessionIds = this._sessionIds;
    return newSession;
  }
}
