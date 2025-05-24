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

#### Chat with Claude

```javascript
// Send a chat message to Claude
const response = await claude.chat('Explain this error: TypeError: Cannot read property of undefined');

if (response.success) {
  console.log(response.data);
} else {
  console.error('Error:', response.error.message);
}
```

#### Run Commands Through Claude

```javascript
// Have Claude run a command for you
const result = await claude.runCommand('Fix the failing tests in src/utils.test.js');

// Check the result
if (result.success) {
  console.log('Claude completed the task');
  console.log('Output:', result.stdout);
}
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

## Advanced Usage

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
  const response = await claude.chat('Refactor this function to use async/await');
  
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
  ClaudeCodeError 
} from 'claude-code-js';

// Type-safe configuration
const options: ClaudeCodeOptions = {
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'claude-3-sonnet',
  workingDirectory: './src',
  verbose: true
};

const claude = new ClaudeCode(options);

// Type-safe response handling
const response: ClaudeCodeResponse = await claude.chat('Generate unit tests for auth.js');
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