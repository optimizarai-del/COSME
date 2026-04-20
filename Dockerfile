FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY examples/ ./examples/
COPY config/ ./config/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check

# Expose port
EXPOSE 3000

# Run server
CMD ["node", "examples/full-server-example.js"]
