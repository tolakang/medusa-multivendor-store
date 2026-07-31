# =============================================================================
# Medusa 2.0 — Monorepo Docker Build (all-in-one)
# Optimized for rate-limited environments
#
# Build with NPM token for authenticated builds (50x higher rate limits):
#   docker build --build-arg NPM_TOKEN=npm_xxxxx .
# =============================================================================
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
ARG NPM_TOKEN
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json .npmrc pnpm-lock.yaml* ./
RUN if [ -n "$NPM_TOKEN" ]; then \
      echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> .npmrc && \
      echo "✓ npm authenticated — 50x higher rate limits enabled"; \
    fi
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    --mount=type=cache,target=/root/.npm \
    (pnpm install \
      --no-frozen-lockfile \
      --prefer-offline \
      --fetch-retries=10 \
      --fetch-retry-mintimeout=120000 \
      --fetch-retry-maxtimeout=600000 \
      --network-concurrency=2 --fetch-retry-factor=2 \
    || (echo "First attempt failed, waiting 120s before retry..." && \
        sleep 120 && \
        pnpm install \
          --no-frozen-lockfile \
          --prefer-offline \
          --fetch-retries=10 \
          --fetch-retry-mintimeout=120000 \
          --fetch-retry-maxtimeout=600000 \
          --network-concurrency=2 --fetch-retry-factor=2))

FROM base AS builder
WORKDIR /app
ENV NODE_ENV=development
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl netcat-openbsd
RUN corepack enable
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa
COPY --from=builder /app/.medusa/server ./
COPY --from=builder /app/src/scripts/start-monorepo.sh ./start-server.sh
RUN chmod +x ./start-server.sh && chown -R medusa:nodejs /app
USER medusa
EXPOSE 9000
ENV PORT=9000
CMD ["./start-server.sh"]
