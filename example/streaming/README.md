# Streaming Examples

This directory contains examples demonstrating the streaming capabilities of claude-code-js.

## Examples

### Basic Streaming (event-emitter-style.js)
Shows how to use the EventEmitter-style streaming API with event handlers.

```bash
node event-emitter-style.js
```

### Session Streaming (session-streaming.js)
Demonstrates streaming within a conversation session.

```bash
node session-streaming.js
```

### Abort Example (abort-example.js)
Shows how to abort a streaming request in progress.

```bash
node abort-example.js
```

## Requirements

Make sure you have:
1. Built the library: `npm run build` (from root directory)
2. Set your API key: `export ANTHROPIC_API_KEY=your-key-here`