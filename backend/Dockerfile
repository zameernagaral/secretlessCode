# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: Build Gitleaks v8 from source
# ──────────────────────────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS gitleaks-builder
ENV CGO_ENABLED=0
RUN go install github.com/zricethezav/gitleaks/v8@latest

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: Download TruffleHog v3 binary
# ──────────────────────────────────────────────────────────────────────────────
FROM alpine:3.19 AS trufflehog-downloader
RUN apk add --no-cache curl tar

# Fetch the latest TruffleHog v3 release for Linux x86_64
# Update the version tag or use a curl-based latest detection for CI
ARG TRUFFLEHOG_VERSION=3.88.34
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then ARCH_TAG="amd64"; else ARCH_TAG="arm64"; fi && \
    curl -sSfL "https://github.com/trufflesecurity/trufflehog/releases/download/v${TRUFFLEHOG_VERSION}/trufflehog_${TRUFFLEHOG_VERSION}_linux_${ARCH_TAG}.tar.gz" \
    | tar -xz -C /usr/local/bin trufflehog && \
    chmod +x /usr/local/bin/trufflehog && \
    trufflehog --version

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3: Production Node.js application image
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install git, bash, ca-certificates, tini (PID 1 signal handler)
RUN apk add --no-cache git bash ca-certificates tini

# Copy CLI scanner binaries from builder stages
COPY --from=gitleaks-builder /go/bin/gitleaks /usr/local/bin/gitleaks
COPY --from=trufflehog-downloader /usr/local/bin/trufflehog /usr/local/bin/trufflehog

# Verify all scanning tools are functional
RUN git --version && gitleaks version && trufflehog --version

# Install production-only Node.js dependencies (cached layer)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY src/ ./src/

# Ensure /tmp is writable for ephemeral scan sandboxes
RUN mkdir -p /tmp && chown -R appuser:appgroup /tmp

USER appuser

ENV NODE_ENV=production
ENV PORT=4000
ENV SCAN_ENGINE=auto

EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
