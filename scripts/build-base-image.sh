#!/bin/bash
# =============================================================================
# Pre-Build Base Image for Medusa Backend
# =============================================================================
# This script builds a base Docker image with all npm dependencies pre-installed.
# Run this ONCE on your Oracle Cloud server to avoid429 rate limits during deploys.
#
# After building, update Dockerfiles to use this base image instead of node:22-alpine.
#
# Usage (on your Oracle Cloud server):
#   bash scripts/build-base-image.sh
#
# Then update your Dockerfiles:
#   Change:  FROM node:22-alpine AS base
#   To:      FROM medusa-backend-base:latest AS base
# =============================================================================

set -e

echo "============================================"
echo "  Pre-Building Medusa Backend Base Image"
echo "  This installs ALL dependencies once."
echo "  Future builds will be ~30 seconds."
echo "============================================"

# Build the base image with all deps
echo ""
echo "Step 1: Building base image with dependencies..."
docker build -t medusa-backend-base:latest - << 'DOCKERFILE'
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
RUN apk add --no-cache libc6-compat curl netcat-openbsd
WORKDIR /app

# Copy only package.json and .npmrc for dependency resolution
COPY apps/backend/package.json apps/backend/.npmrc ./

# Install ALL dependencies (including devDependencies for build)
# This step takes 10-15 min on first run but is cached in the base image
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install \
      --no-frozen-lockfile \
      --prefer-offline \
      --fetch-retries=10 \
      --fetch-retry-mintimeout=120000 \
      --fetch-retry-maxtimeout=600000 \
      --network-concurrency=2

# Create user for runtime
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa

# The base image now has all node_modules cached
DOCKERFILE

echo ""
echo "Step 2: Testing the base image..."
docker run --rm medusa-backend-base:latest node --version
docker run --rm medusa-backend-base:latest pnpm --version

echo ""
echo "✅ Base image built successfully!"
echo ""
echo "To use this base image, update your Dockerfiles:"
echo ""
echo "  FROM medusa-backend-base:latest AS base"
echo ""
echo "This replaces:"
echo "  FROM node:22-alpine AS base"
echo "  RUN corepack enable && corepack prepare pnpm@latest --activate"
echo ""
echo "The base image includes:"
echo "  - Node.js 22"
echo "  - pnpm (latest)"
echo "  - All Medusa dependencies pre-installed"
echo "  - curl and netcat for health checks"
echo ""
echo "Future builds will take ~30-60 seconds instead of 10-15 minutes."
