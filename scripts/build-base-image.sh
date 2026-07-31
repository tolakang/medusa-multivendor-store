#!/bin/bash
# =============================================================================
# build-base-image.sh — Pre-build Medusa base image with dependencies
# Run this ONCE, then all server/worker builds will be fast
# =============================================================================
set -e

IMAGE_NAME="${1:-medusa-backend-base}"
REGISTRY="${2:-}"

echo "============================================"
echo "Building Medusa base image: ${IMAGE_NAME}"
echo "============================================"
echo ""
echo "This installs all ~800 dependencies ONCE."
echo "Takes 10-15 minutes on first run."
echo "Subsequent server/worker builds will take 3-5 minutes."
echo ""

# Build the base image from Dockerfile.base
docker build \
  -t "${IMAGE_NAME}" \
  -f apps/backend/Dockerfile.base \
  apps/backend/

echo ""
echo "✅ Base image built: ${IMAGE_NAME}"
echo ""

# Optional: Push to registry
if [ -n "${REGISTRY}" ]; then
  FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}"
  echo "Pushing to ${FULL_IMAGE}..."
  docker tag "${IMAGE_NAME}" "${FULL_IMAGE}"
  docker push "${FULL_IMAGE}"
  echo "✅ Pushed to ${FULL_IMAGE}"
  echo ""
  echo "Update your Dockerfiles to use:"
  echo "  FROM ${FULL_IMAGE} AS deps"
else
  echo "To push to a registry, run:"
  echo "  $0 ${IMAGE_NAME} your-registry.com"
  echo ""
  echo "Or use locally with Docker BuildKit cache."
  echo "The BuildKit cache mount already speeds up rebuilds."
fi

echo ""
echo "Next steps:"
echo "  1. Deploy server on Dokploy — first build will be fast if base is cached"
echo "  2. Deploy worker — shares the same deps, also fast"
echo "  3. Deploy storefront — separate deps, builds independently"
