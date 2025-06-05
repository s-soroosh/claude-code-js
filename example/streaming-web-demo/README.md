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

- `ANTHROPIC_API_KEY`: Your Claude API key (required)
- `PORT`: Server port (default: 3001)