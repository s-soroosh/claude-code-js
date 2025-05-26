# Claude Code JS

A JavaScript SDK for integrating with Claude Code, Anthropic's official CLI tool for Claude.

## Overview

This project provides a JavaScript/TypeScript SDK that allows developers to programmatically interact with Claude Code, enabling AI-powered software engineering capabilities in their applications.

## Installation

```bash
npm install claude-code-js
```

or with yarn:

```bash
yarn add claude-code-js
```

## Quick Start

### Basic Setup

```javascript
import { ClaudeCode } from 'claude-code-js';

// Initialize the SDK
const claude = new ClaudeCode({
  apiKey: process.env.CLAUDE_API_KEY, // Optional: if already logged in
  model: 'claude-3-sonnet', // Optional: specify model
  workingDirectory: './my-project', // Optional: set working directory
  verbose: false // Optional: enable verbose logging
});
```

### Example Usage

#### Single Chat with Claude

```javascript
// Send a chat message to Claude with a prompt
const response = await claude.chat({
  prompt: 'Explain this error: TypeError: Cannot read property of undefined',
  systemPrompt: 'You are a helpful coding assistant', // Optional
  appendSystemPrompt: 'Keep explanations concise' // Optional
});

if (response.success) {
  console.log('Result:', response.message.result);
  console.log('Session ID:', response.message.session_id);
  console.log('Cost:', response.message.cost_usd);
} else {
  console.error('Error:', response.error.message);
}
```

#### Run Commands Through Claude

```javascript
// Have Claude execute a task
const result = await claude.runCommand('Fix the failing tests in src/utils.test.js');

if (result.success) {
  console.log('Claude completed the task');
  console.log('Result:', result.message.result);
  console.log('Duration:', result.message.duration_ms, 'ms');
}
```

#### Sessions for Multi-turn Conversations

```javascript
// Create a new session for ongoing conversations
const session = claude.newSession();

// Start the conversation
const firstMessage = await session.prompt({
  prompt: 'What is 2 + 2?',
  systemPrompt: 'You are expert at math. Always return a single line of text in format: equation = result'
});
console.log('First response:', firstMessage.result);

// Continue the conversation
const secondMessage = await session.prompt({
  prompt: '3 + 3 = 6'
});
console.log('Second response:', secondMessage.result);

// Ask for history
const history = await session.prompt({
  prompt: 'Send the history of all validations you have done so far'
});
console.log('History:', history.result);

// Session tracks all messages and session IDs
console.log('Total messages:', session.messages.length);
console.log('All session IDs:', session.sessionIds);
```

#### Direct Command Execution

```javascript
import { executeCommand, streamCommand } from 'claude-code-js';

// Execute a command and get the full output
const { stdout, stderr, exitCode } = await executeCommand(['npm', 'test'], {
  cwd: './my-project',
  timeout: 30000
});

// Stream command output in real-time
const stream = streamCommand(['npm', 'run', 'dev'], {
  onStdout: (data) => console.log('Output:', data),
  onStderr: (data) => console.error('Error:', data)
});

// Wait for completion
await stream;
```

### Real-World Examples

#### Code Review Assistant

```javascript
const claude = new ClaudeCode();

// Create a code review session
const reviewer = claude.newSession();

// Start the review
const initialReview = await reviewer.prompt({
  prompt: `Review this Express route for security issues:
    app.post('/login', (req, res) => {
      const { username, password } = req.body;
      const user = db.query('SELECT * FROM users WHERE username = "' + username + '"');
      if (user && user.password === password) {
        res.json({ token: jwt.sign({ id: user.id }, 'secret') });
      }
    })`,
  systemPrompt: 'You are a security-focused code reviewer. Identify vulnerabilities and suggest fixes.'
});

console.log('Initial review:', initialReview.result);

// Ask for specific improvements
const improvements = await reviewer.prompt({
  prompt: 'Show me how to fix the SQL injection vulnerability'
});
console.log('Improved code:', improvements.result);
```

#### Test Generator

```javascript
const claude = new ClaudeCode({ workingDirectory: './my-app' });

// Generate tests for a specific function
const response = await claude.chat({
  prompt: `Generate Jest unit tests for this function:
    export function calculateDiscount(price, discountPercent) {
      if (discountPercent < 0 || discountPercent > 100) {
        throw new Error('Invalid discount percentage');
      }
      return price * (1 - discountPercent / 100);
    }`,
  systemPrompt: 'Generate comprehensive Jest tests with edge cases'
});

if (response.success) {
  // Save the generated tests
  await writeFile('./tests/calculateDiscount.test.js', response.message.result);
}
```

#### Interactive Debugging Helper

```javascript
const debugSession = claude.newSession();

// Start the debugging session
await debugSession.prompt({
  prompt: 'I have a React component that re-renders infinitely. Help me debug it.',
  systemPrompt: 'You are a React debugging expert. Ask clarifying questions and provide solutions.'
});

// Provide more context
await debugSession.prompt({
  prompt: `Here's my component:
    function UserList() {
      const [users, setUsers] = useState([]);
      const fetchUsers = async () => {
        const data = await api.getUsers();
        setUsers(data);
      };
      fetchUsers();
      return <div>{users.map(u => <div>{u.name}</div>)}</div>;
    }`
});

// Get step-by-step debugging guidance
const solution = await debugSession.prompt({
  prompt: `What's causing the infinite re-render and how do I fix it?`
});
```

## Advanced Usage

### Working with Multiple Sessions

```javascript
const claude = new ClaudeCode();

// Create independent sessions for different tasks
const codeReviewSession = claude.newSession();
const debugSession = claude.newSession();

// Start the code review session
await codeReviewSession.prompt({
  prompt: 'Review this code for best practices: function getData() { return fetch("/api").then(r => r.json()) }',
  systemPrompt: 'You are a code reviewer focused on best practices and performance'
});

// Start the debugging session
await debugSession.prompt({
  prompt: 'Help me debug this error: ReferenceError: user is not defined',
  systemPrompt: 'You are a debugging expert'
});

// Continue conversations independently
await codeReviewSession.prompt({ prompt: 'How can I add error handling?' });
await debugSession.prompt({ prompt: 'The error occurs in line 45 of auth.js' });
```

### Chaining Sessions

```javascript
// Use output from one session as input to another
const mathSession = claude.newSession();
const mathResult = await mathSession.prompt({
  prompt: 'Calculate 15 * 23',
  systemPrompt: 'You are a math expert. Return only the numeric result.'
});

const validationSession = claude.newSession();
const validationResult = await validationSession.prompt({
  prompt: mathResult.result,
  systemPrompt: 'You are expert at validating math calculations.'
});

console.log('Validation result:', validationResult.result);
```

### Session Forking and Reverting

#### Fork Sessions for Parallel Explorations

The `fork()` method creates a new session with the same conversation history, allowing you to explore different conversation branches without affecting the original session.

```javascript
const claude = new ClaudeCode();
const mainSession = claude.newSession();

// Start a conversation
await mainSession.prompt({
  prompt: 'Write a function to calculate factorial',
  systemPrompt: 'You are a helpful coding assistant'
});

await mainSession.prompt({
  prompt: 'Now make it recursive'
});

// Fork the session to explore a different approach
const iterativeSession = mainSession.fork();
const recursiveSession = mainSession.fork();

// Explore iterative approach in one fork
await iterativeSession.prompt({
  prompt: 'Actually, show me an iterative version instead'
});

// Explore memoized approach in another fork
await recursiveSession.prompt({
  prompt: 'Can you add memoization to the recursive version?'
});

// Original session remains unchanged
console.log('Main session messages:', mainSession.messages.length); // 2
console.log('Iterative fork messages:', iterativeSession.messages.length); // 3
console.log('Recursive fork messages:', recursiveSession.messages.length); // 3
```

#### Revert Session State

The `revert()` method removes the most recent messages and session IDs, allowing you to "undo" conversation turns.

```javascript
const session = claude.newSession();

// Build up a conversation
await session.prompt({ prompt: 'Write a Python hello world' });
await session.prompt({ prompt: 'Now add a loop that prints it 5 times' });
await session.prompt({ prompt: 'Add error handling' });

console.log('Messages before revert:', session.messages.length); // 3

// Revert the last message
session.revert();
console.log('Messages after single revert:', session.messages.length); // 2

// Revert multiple messages at once
session.revert(2);
console.log('Messages after reverting 2:', session.messages.length); // 0

// Continue from the reverted state
await session.prompt({ prompt: 'Write a JavaScript hello world instead' });
```

#### Real-World Use Case: A/B Testing Code Solutions

```javascript
const claude = new ClaudeCode();
const session = claude.newSession();

// Set up the problem
await session.prompt({
  prompt: 'I need to process a large CSV file with millions of rows. What approach should I use?',
  systemPrompt: 'You are an expert in data processing and performance optimization'
});

// Fork to explore different solutions
const streamingFork = session.fork();
const chunkingFork = session.fork();
const parallelFork = session.fork();

// Explore streaming approach
const streamingSolution = await streamingFork.prompt({
  prompt: 'Show me how to implement this using Node.js streams'
});

// Explore chunking approach
const chunkingSolution = await chunkingFork.prompt({
  prompt: 'Show me how to process this in chunks with a batch size'
});

// Explore parallel processing
const parallelSolution = await parallelFork.prompt({
  prompt: 'Show me how to use worker threads for parallel processing'
});

// Compare solutions
console.log('Streaming approach:', streamingSolution.result);
console.log('Chunking approach:', chunkingSolution.result);
console.log('Parallel approach:', parallelSolution.result);

// Pick the best approach and continue
await parallelFork.prompt({
  prompt: 'Add progress tracking to this implementation'
});
```

### Configuration Management

```javascript
// Update configuration on the fly
claude.setOptions({
  model: 'claude-3-opus',
  verbose: true
});

// Get current configuration
const options = claude.getOptions();
console.log('Current model:', options.model);
```

### Version Checking

```javascript
// Get the Claude Code CLI version
const version = await claude.version();
console.log('Claude Code CLI version:', version);
```

### Error Handling

```javascript
try {
  const response = await claude.chat({
    prompt: 'Refactor this function to use async/await'
  });
  
  if (!response.success) {
    // Handle Claude Code specific errors
    console.error(`Error Code: ${response.error.code}`);
    console.error(`Message: ${response.error.message}`);
    
    if (response.error.details) {
      console.error('Details:', response.error.details);
    }
  }
} catch (error) {
  // Handle network or other errors
  console.error('Unexpected error:', error);
}
```

## TypeScript Support

The SDK includes full TypeScript support with exported types:

```typescript
import { 
  ClaudeCode, 
  ClaudeCodeOptions, 
  ClaudeCodeResponse,
  ClaudeCodeError,
  ClaudeCodeMessage,
  Prompt
} from 'claude-code-js';

// Type-safe configuration
const options: ClaudeCodeOptions = {
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'claude-3-sonnet',
  workingDirectory: './src',
  verbose: true
};

const claude = new ClaudeCode(options);

// Type-safe prompt
const prompt: Prompt = {
  prompt: 'Generate unit tests for auth.js',
  systemPrompt: 'You are a test generation expert',
  appendSystemPrompt: 'Use Jest framework'
};

// Type-safe response handling
const response: ClaudeCodeResponse = await claude.chat(prompt);

if (response.success && response.message) {
  const message: ClaudeCodeMessage = response.message;
  console.log('Result:', message.result);
  console.log('Cost in USD:', message.cost_usd);
  console.log('Duration:', message.duration_ms);
}
```

## Configuration Options

```javascript
const claude = new ClaudeCode({
  apiKey: 'your-api-key', // Optional: if already logged in via CLI
  model: 'claude-3-sonnet', // Optional: model to use
  workingDirectory: './path/to/project', // Optional: working directory
  verbose: false // Optional: enable verbose output
});
```

## Contributing

We welcome contributions! If you encounter any issues or have ideas for improvements, please don't hesitate to:

- 🐛 **Report bugs**: Open an issue describing the problem and steps to reproduce
- 💡 **Request features**: Share your ideas for new functionality
- ❓ **Ask questions**: Get help with implementation or clarification
- 🔧 **Submit PRs**: Contribute code improvements or fixes

### Opening Issues

Please visit our [GitHub Issues](https://github.com/anthropics/claude-code-js/issues) page to:

1. Search existing issues to avoid duplicates
2. Use issue templates when available
3. Provide detailed information about your environment and the problem
4. Include code examples when relevant

## Support

If you need help or have questions:

1. Check the [documentation](https://docs.anthropic.com/claude-code)
2. Search through existing [issues](https://github.com/anthropics/claude-code-js/issues)
3. Open a new issue with the question tag

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.