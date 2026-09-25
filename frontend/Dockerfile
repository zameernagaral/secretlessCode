# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: Install dependencies
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: Build Next.js application
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Build argument — inject the backend API URL at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3: Lean production runner
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root
RUN addgroup -S nextgroup && adduser -S nextuser -G nextgroup

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the necessary output from the builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Give nextuser ownership
RUN chown -R nextuser:nextgroup /app

USER nextuser

EXPOSE 3000

CMD ["node", "server.js"]
