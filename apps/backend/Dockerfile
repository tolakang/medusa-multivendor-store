FROM node:20-alpine AS base

# ---- deps stage: install all dependencies ----
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

# ---- builder stage: compile medusa ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# medusa build creates .medusa/server/ with compiled output
RUN npm run build

# Install production-only dependencies in the build output directory
# This is how Medusa v2 production builds work - .medusa/server/ has its own package.json
RUN cd .medusa/server && npm install --production

# ---- runner stage: production image ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa

# Copy the entire .medusa/server/ build output (contains compiled JS, config, admin, deps)
COPY --from=builder /app/.medusa/server ./

USER medusa

EXPOSE 9000

ENV PORT=9000

# Run database migrations then start the Medusa server
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
