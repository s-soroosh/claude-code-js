const { ClaudeCode } = require('../../dist/index.js');

async function main() {
  const claude = new ClaudeCode({
    verbose: true
  });

  console.log('Starting streaming request...\n');

  try {
    const response = await claude.chat({
      prompt: 'Write a haiku about JavaScript',
      stream: true,
      onToken: (token) => {
        process.stdout.write(token);
      },
      onComplete: (result) => {
        console.log('\n\nStreaming complete!');
        console.log('Session ID:', response.sessionId);
      },
      onError: (error) => {
        console.error('\nError:', error.message);
      }
    });

    // The response is an EventEmitter
    response.on('debug', (event) => {
      console.log('\nDebug event:', event.type);
    });

    // Wait for completion
    const result = await response.result;
    console.log('\nFinal result length:', result.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();