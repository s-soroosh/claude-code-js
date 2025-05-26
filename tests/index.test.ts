import { describe, expect, it } from 'vitest';
import { ClaudeCode, executeCommand } from '../src';

describe('ClaudeCode', () => {
  it('should create an instance', () => {
    const claudeCode = new ClaudeCode();
    expect(claudeCode).toBeDefined();
    expect(claudeCode.getOptions()).toMatchObject({
      workingDirectory: expect.any(String),
      verbose: false,
    });
  });

  it('should handle chat command response', async () => {
    const claudeCode = new ClaudeCode();
    const response = await claudeCode.chat('say hello');
    console.log({ response });
    expect(response.message).toBeTruthy();
  }, 100_000);

  it.skip('streamCommand', async () => {
    const result = await executeCommand([
      'npx',
      'claude',
      '-p',
      'say hello',
      '--verbose',
      '--dangerously-skip-permissions',
      '--output-format',
      'json',
    ]);
    console.log({ result });
  }, 10_000);
});
