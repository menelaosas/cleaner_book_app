# docker/backend.Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /app

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy necessary files from builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY backend/package*.json ./

# Create uploads directory
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

USER nodejs

EXPOSE 5000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
