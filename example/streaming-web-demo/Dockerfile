# Use Node.js LTS version
FROM node:20-slim

# Install claude-code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY *.js *.html ./

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