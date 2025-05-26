import { ClaudeCode } from 'claude-code-js';

async function main() {
  const claude = new ClaudeCode();

  console.log('Testing claude-code-js...\n');

  try {
    // Test 1: Simple message
    console.log('Test 1: Sending a simple message');
    const response1 = await claude.chat('What is 2 + 2?');
    console.log('Response:', response1);
    console.log('---\n');

    // Test 2: Code generation
    console.log('Test 2: Code generation request');
    const response2 = await claude.chat('Write a simple JavaScript function that adds two numbers');
    console.log('Response:', response2);
    console.log('---\n');

    // Test 3: Using options
    console.log('Test 3: Message with options');
    const response3 = await claude.chat('List the files in the current directory');
    console.log('Response:', response3);
    console.log('---\n');

    console.log(await claude.version());
    console.log(await claude.runCommand('what is current directory?'));
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
