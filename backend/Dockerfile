# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: Build Gitleaks binary from source (Go multi-stage build)
# Pinning to v8 for stability — update the tag as new releases are available
# ──────────────────────────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS gitleaks-builder
ENV CGO_ENABLED=0
ENV GOFLAGS="-mod=mod"
RUN go install github.com/zricethezav/gitleaks/v8@latest

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: Production Node.js application image
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Run as non-root user for container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install git, bash, ca-certificates (required by Gitleaks and git clone)
RUN apk add --no-cache git bash ca-certificates tini

# Copy Gitleaks binary from builder stage
COPY --from=gitleaks-builder /go/bin/gitleaks /usr/local/bin/gitleaks

# Verify tools are available at build time
RUN git --version && gitleaks version

# Install production-only Node.js dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application source (after deps for better layer caching)
COPY src/ ./src/

# Ensure /tmp is writable by the app user (for ephemeral scan sandboxes)
RUN mkdir -p /tmp && chown -R appuser:appgroup /tmp

# Switch to non-root user
USER appuser

# Environment defaults (override via docker-compose or Render env vars)
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Use tini as PID 1 for proper signal handling and zombie reaping
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
