# Multi-stage Dockerfile for Secretless Code Backend with Gitleaks and Git
FROM golang:1.22-alpine AS gitleaks-builder
ENV CGO_ENABLED=0
RUN go install github.com/zricethezav/gitleaks/v8@latest

FROM node:20-alpine
WORKDIR /app

# Install git, bash, and ca-certificates
RUN apk add --no-cache git bash ca-certificates

# Copy gitleaks binary from builder
COPY --from=gitleaks-builder /go/bin/gitleaks /usr/local/bin/gitleaks

# Verify git and gitleaks installations
RUN git --version && gitleaks version

# Install node dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Set environment
ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "src/server.js"]
