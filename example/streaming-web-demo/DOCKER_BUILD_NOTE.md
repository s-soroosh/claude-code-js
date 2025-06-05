# Docker Build Note

The current Dockerfile in this directory has a TypeScript compilation issue when building inside Docker due to execa import differences. 

## Current Status

The streaming demo is currently running using the previously built image `streaming-web-demo-claude-web-demo`.

## Issue

When building from the root context, TypeScript compilation fails with:
```
src/claude-code.ts(146,26): error TS2349: This expression is not callable.
  Type 'typeof import("/claude-code-js/node_modules/execa/index")' has no call signatures.
```

This appears to be related to the way execa is imported in Docker vs local environment.

## Workaround

For now, you can:
1. Use the existing working image: `streaming-web-demo-claude-web-demo`
2. Or build locally and copy the dist folder into the Docker image
3. Or use the npm published version of claude-code-js instead of building from source

## To Run the Demo

```bash
docker run -d --name claude-streaming-demo \
  -p 3001:3001 \
  -v ~/.claude:/home/node/.claude:ro \
  -e HOME=/home/node \
  streaming-web-demo-claude-web-demo
```

Then visit http://localhost:3001