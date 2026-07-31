# =============================================================================
# Next.js Storefront — Optimized for rate-limited environments
# =============================================================================
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
COPY package.json .npmrc pnpm-lock.yaml* ./
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
ENV NODE_ENV=production
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
