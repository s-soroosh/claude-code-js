import { ClaudeCode } from 'claude-code-js';

async function runTests() {
  const claude = new ClaudeCode();
  
  console.log('Running claude-code-js tests...\n');
  
  const tests = [
    {
      name: 'Basic arithmetic',
      message: 'Calculate 15 * 7',
      expected: '105'
    },
    {
      name: 'Command generation',
      message: 'What command lists all files including hidden ones?',
      expected: 'ls -la'
    },
    {
      name: 'Code explanation',
      message: 'What does Array.prototype.map() do in one sentence?',
      options: { maxTokens: 50 }
    },
    {
      name: 'Error handling',
      message: '',
      shouldError: true
    }
  ];
  
  for (const test of tests) {
    console.log(`Test: ${test.name}`);
    try {
      const response = await claude.send(test.message, test.options);
      
      if (test.shouldError) {
        console.log('❌ Expected error but got response:', response);
      } else {
        console.log('✅ Response:', response);
        if (test.expected && !response.includes(test.expected)) {
          console.log(`⚠️  Expected to contain "${test.expected}"`);
        }
      }
    } catch (error) {
      if (test.shouldError) {
        console.log('✅ Expected error:', error.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('---\n');
  }
}

runTests();