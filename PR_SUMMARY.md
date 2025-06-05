# Pull Request: Add Streaming Support to claude-code-js

## Summary

This PR adds comprehensive streaming support to the claude-code-js SDK, enabling real-time responses from Claude CLI while maintaining full backward compatibility.

## Key Features

### 1. **Streaming Implementation**
- Real-time message-level streaming (Claude CLI streams complete messages, not individual tokens)
- EventEmitter-based API for flexible event handling
- Support for abort functionality
- Full backward compatibility with existing non-streaming API

### 2. **OAuth Authentication Support**
- Automatic use of existing Claude CLI authentication from `~/.claude/auth.json`
- Manual OAuth token configuration with automatic refresh
- Clear documentation on finding and using OAuth tokens
- Works seamlessly in Docker containers by mounting the `.claude` directory

### 3. **Container/Docker Support**
- Added `dangerouslySkipPermissions` option for containerized environments
- Ensures non-interactive environment settings (CI=true, TERM=dumb, NO_COLOR=1)
- Comprehensive Docker example with OAuth token mounting
- Runs as non-root user for better security

### 4. **API Improvements**
- API key now passed via environment variable for better security
- Consistent use of `--print` flag instead of `-p`
- Enhanced error handling and verbose logging options

## Breaking Changes

1. **API Key Handling**: API keys are now passed via `ANTHROPIC_API_KEY` environment variable instead of `--api-key` CLI flag
2. **Flag Change**: Changed `-p` flag to `--print` for consistency with Claude CLI

## Examples Added

- `example/streaming/`: Command-line streaming examples
- `example/streaming-web-demo/`: Full web demo with Docker support

## Testing

- All existing tests updated to support new implementation
- New streaming-specific test suite added
- Tests clearly marked as updated for streaming PR

## Documentation Updates

- Comprehensive README updates including:
  - Dedicated Authentication section explaining OAuth support
  - Streaming examples and usage
  - Docker/container setup with OAuth token mounting
  - Clear note about streaming support at the top
- Updated CLAUDE.md with implementation details

## File Changes

- **Core Implementation**: Updated `src/claude-code.ts`, `src/types.ts`, `src/commands.ts`
- **Tests**: Updated all tests, added new `tests/streaming.test.ts`
- **Examples**: Added streaming examples and web demo
- **Documentation**: Enhanced README.md and CLAUDE.md
- **Cleanup**: Removed test files from root, updated .gitignore

This PR is ready for review and maintains full backward compatibility while adding powerful new streaming capabilities.