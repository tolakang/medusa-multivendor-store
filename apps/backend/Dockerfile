FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./

# Configure npm to reduce requests and handle rate limits
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 60000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    for i in 1 2 3 4 5; do \
      echo "Attempt $i: npm install..." && \
      npm install && \
      echo "Attempt $i succeeded" && \
      break || \
      echo "Attempt $i failed, waiting 60s before retry..." && \
      sleep 60; \
    done

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 medusa

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/medusa-config.ts ./medusa-config.ts

USER medusa

EXPOSE 9000

ENV PORT=9000

CMD ["npm", "run", "start"]
