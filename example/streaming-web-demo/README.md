# Streaming Web Demo

A web-based demonstration of the claude-code-js streaming capabilities.

## Features

- Real-time streaming of Claude responses
- Docker support for Windows/WSL environments
- Support for both streaming and non-streaming modes
- Container-friendly with permission skip option

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open http://localhost:3001 in your browser

## Running with Docker

1. Build and run:
   ```bash
   docker-compose up
   ```

2. Open http://localhost:3001 in your browser

## Environment Variables

- `ANTHROPIC_API_KEY`: Your Claude API key (required if not using OAuth)
- `PORT`: Server port (default: 3001)

## Important Notes

1. **Claude CLI Write Access**: The `.claude` directory must be mounted as read-write (not read-only) because Claude CLI needs to write state information to `.claude.json`.

2. **Permissions**: If running in Docker, you may need to enable the "Skip Permissions" checkbox in the UI or set `dangerouslySkipPermissions: true` in the code.