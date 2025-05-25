import { describe, expect, it } from 'vitest';
import { ClaudeCode } from '../src';

describe('acceptance', () => {
  it('should create a new session', async () => {
    const claude = new ClaudeCode();
    const session1 = await claude.newSession({
      prompt: 'What is 2 + 2?',
      systemPrompt:
        'You are expert at math. Always return a single line of text. In this format `equation = result`',
    });
    const session1Message = session1.messages.at(-1);
    console.log(session1Message);
    expect(session1Message).toBeTruthy();
    const session2 = await claude.newSession({
      prompt: session1Message.result,
      systemPrompt: 'You are expert at validating math calculations .',
    });
    console.log(session2.messages.at(-1));
    console.log(await session2.prompt({ prompt: '3+3 = 6' }));
    console.log(
      await session2.prompt({ prompt: 'send the history of all validations you have done so far' })
    );
  }, 50_000);
});
