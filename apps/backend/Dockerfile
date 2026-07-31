# =============================================================================
# Medusa 2.0 Multi-Vendor Backend — Production Dockerfile (Monorepo)
# =============================================================================
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json ./
RUN if [ ! -f package-lock.json ]; then \
      npm install --legacy-peer-deps --no-audit --no-fund --package-lock-only; \
    fi && \
    cp package-lock.json /tmp/lockfile-backup 2>/dev/null || true

COPY package-lock.json* ./
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    echo "Installing dependencies (this may take 5-15 minutes on first build)..." && \
    for i in 1 2 3 4 5; do \
      echo "Attempt $i: npm install..." && \
      npm install --legacy-peer-deps --no-audit --no-fund && \
      echo "Attempt $i succeeded" && \
      break || \
      echo "Attempt $i failed, waiting 30s before retry..." && \
      sleep 30; \
    done

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl netcat-openbsd

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa

COPY --from=builder /app/.medusa/server ./

COPY --from=builder /app/src/scripts/start-monorepo.sh ./start-monorepo.sh
RUN chmod +x ./start-monorepo.sh && chown -R medusa:nodejs /app

USER medusa

EXPOSE 9000

ENV PORT=9000

CMD ["./start-monorepo.sh"]
