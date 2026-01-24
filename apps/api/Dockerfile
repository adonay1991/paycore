# PayCore API Dockerfile
# Multi-stage build for optimal image size

# =============================================================================
# Build Stage
# =============================================================================
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# Copy all package.json files for dependency installation
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies from monorepo root
RUN bun install

# Copy source code
COPY apps/api ./apps/api
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY tooling ./tooling
COPY tsconfig.json ./

# Build the API from root (to access hoisted node_modules)
RUN bun build apps/api/src/index.ts --outdir apps/api/dist --target bun

# =============================================================================
# Production Stage
# =============================================================================
FROM oven/bun:1.3-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built files and dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV PORT=3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3002

# Start the server
CMD ["bun", "dist/index.js"]
