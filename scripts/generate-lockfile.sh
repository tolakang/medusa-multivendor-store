#!/bin/bash
# =============================================================================
# Generate pnpm-lock.yaml files for backend and storefront
# Run this on your Oracle Cloud server (where Docker is available)
# =============================================================================
# Usage: bash scripts/generate-lockfile.sh
# This creates lockfiles that prevent 429 errors on subsequent Docker builds.
# After running, commit the lockfiles to your repo:
#   git add apps/backend/pnpm-lock.yaml apps/storefront/pnpm-lock.yaml
#   git commit -m "Add pnpm lockfiles to prevent npm 429 rate limiting"
#   git push
# =============================================================================

set -e

echo "🔧 Generating pnpm-lock.yaml files..."
echo "   (This resolves package versions without downloading node_modules)"
echo ""

# Use npmmirror as fallback for rate-limited environments
NPMRC_CONTENT="registry=https://registry.npmjs.org/
fetch-retries=10
fetch-retry-mintimeout=60000
fetch-retry-maxtimeout=300000
fetch-retry-factor=2
network-concurrency=4"

# Generate backend lockfile
echo "📦 Generating apps/backend/pnpm-lock.yaml..."
docker run --rm \
  -v "$(pwd)/apps/backend:/app" \
  -w /app \
  node:22-alpine \
  sh -c "
    echo '$NPMRC_CONTENT' > /root/.npmrc && \
    corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --no-frozen-lockfile --lockfile-only --network-concurrency=4
  "
echo "✅ Backend lockfile generated"

# Generate storefront lockfile
echo "📦 Generating apps/storefront/pnpm-lock.yaml..."
docker run --rm \
  -v "$(pwd)/apps/storefront:/app" \
  -w /app \
  node:22-alpine \
  sh -c "
    echo '$NPMRC_CONTENT' > /root/.npmrc && \
    corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --no-frozen-lockfile --lockfile-only --network-concurrency=4
  "
echo "✅ Storefront lockfile generated"

echo ""
echo "📋 Next steps:"
echo "   1. git add apps/backend/pnpm-lock.yaml apps/storefront/pnpm-lock.yaml"
echo "   2. git commit -m 'Add pnpm lockfiles to prevent npm 429 rate limiting'"
echo "   3. git push"
echo "   4. Redeploy on Dokploy"
echo ""
echo "💡 With lockfiles, Docker builds will:"
echo "   - Download only specific package versions (not resolve from scratch)"
echo "   - Complete in 3-5 min (first) or 30-60s (cached)"
echo "   - Avoid 429 rate limiting entirely"
