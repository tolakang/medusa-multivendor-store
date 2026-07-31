# =============================================================================
# Medusa 2.0 Backend (monorepo mode — generic Dockerfile) (pnpm)
# =============================================================================
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    echo "Installing dependencies with pnpm..." && \
    pnpm install --frozen-lockfile || pnpm install

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
