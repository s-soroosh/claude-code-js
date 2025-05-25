# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development
- `npm run build` - Build the TypeScript project to dist/
- `npm run dev` - Watch mode for development (rebuilds on file changes)
- `npm run clean` - Remove the dist/ directory

### Testing
- `npm test` - Run all tests using Vitest
- `npm test -- tests/claude-code.test.ts` - Run a specific test file
- `npm test -- --coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Run ESLint on all TypeScript files
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run format` - Format code using Prettier

### Publishing
- `npm run prepublishOnly` - Automatically runs clean and build before publishing

## Architecture Overview

This is a TypeScript SDK wrapper for the claude-code CLI. The architecture follows a clean separation of concerns:

### Core Components

1. **ClaudeCode Class** (`src/claude-code.ts`): Main entry point that wraps the claude CLI
   - Handles command construction with proper JSON output format
   - Manages API key, model, and working directory options
   - Provides methods: `chat()`, `runCommand()`, `newSession()`, `version()`
   - Uses execa for process execution

2. **Session Class** (`src/session.ts`): Manages multi-turn conversations
   - Tracks session IDs and message history
   - Maintains conversation context across multiple prompts
   - Automatically resumes the last session ID when continuing conversations

3. **Command Utilities** (`src/commands.ts`): Low-level process execution
   - `executeCommand()` - Executes commands and returns full output
   - `streamCommand()` - Provides real-time streaming of command output
   - Both use execa under the hood for robust process management

4. **Type Definitions** (`src/types.ts`): TypeScript interfaces for type safety
   - Defines all request/response shapes
   - Provides proper typing for options, messages, and errors

### Key Design Patterns

- **Command Pattern**: All claude CLI interactions go through command construction with JSON output parsing
- **Session Management**: Sessions automatically track and resume conversations using session IDs
- **Error Handling**: Consistent error wrapping with ExecaError details preserved
- **Flexible Input**: Prompts accept either simple strings or structured objects with system prompts

### Testing Structure

Tests are located in `tests/` and use Vitest. The test suite includes:
- Unit tests for ClaudeCode class methods
- Session management tests
- Command execution tests
- Error handling scenarios

Coverage reporting is configured to exclude type definitions and index files.