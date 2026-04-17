FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY examples/ ./examples/
COPY config/ ./config/
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
EXPOSE 3000
CMD ["node", "src/index.js"]
