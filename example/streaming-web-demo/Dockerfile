# Use Node.js LTS version
FROM node:20-slim

# Install claude-code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Set working directory for main library
WORKDIR /claude-code-js

# Copy package files for main library
COPY package*.json ./

# Install main library dependencies
RUN npm install

# Copy source files for main library
COPY src ./src
COPY tsconfig.json ./

# Build the main library
RUN npm run build

# Now set up the demo
WORKDIR /app

# Copy demo package files
COPY example/streaming-web-demo/package.json ./

# Install demo dependencies
RUN npm install

# Copy demo application files
COPY example/streaming-web-demo/*.js example/streaming-web-demo/*.html ./

# Link the built library
RUN rm -rf node_modules/claude-code-js && \
    ln -sf /claude-code-js node_modules/claude-code-js

# Create workspace directory for Claude
RUN mkdir -p /workspace && chown node:node /workspace

# Change ownership of directories to node user
RUN chown -R node:node /app /claude-code-js

# Set environment variables for non-interactive mode
ENV NO_COLOR=1
ENV CI=true
ENV TERM=dumb
ENV HOME=/home/node

# Switch to node user (UID 1000)
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Run the server
CMD ["node", "server.js"]