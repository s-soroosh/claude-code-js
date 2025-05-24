import { ClaudeCode } from './claude-code';
import { ClaudeCodeMessage, Prompt } from './types';

export class Session {
  private claudeCode: ClaudeCode;
  public readonly sessionIds: string[] = [];
  public readonly messages: ClaudeCodeMessage[] = [];

  public constructor(cloudCode: ClaudeCode, initialMessage: ClaudeCodeMessage) {
    this.claudeCode = cloudCode;
    this.messages.push(initialMessage);
    this.sessionIds.push(initialMessage.session_id);
  }

  async prompt(prompt: Prompt): Promise<ClaudeCodeMessage> {
    const response = await this.claudeCode.chat(prompt, this.sessionIds.at(-1));
    if (response.message) {
      this.messages.push(response.message);
      this.sessionIds.push(response.message.session_id);
      return response.message;
    } else {
      console.error('Error in the prompt:', { error: response.error });
      throw new Error('No message returned from Claude');
    }
  }
}
