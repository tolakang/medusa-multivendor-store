#!/bin/sh
set -e

echo "=========================================="
echo "Medusa Worker Starting..."
echo "=========================================="

# Extract host and port from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\2|p')

# Extract host and port from REDIS_URL
REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's|redis://\([^:]*\):\([0-9]*\).*|\1|p')
REDIS_PORT=$(echo "$REDIS_URL" | sed -n 's|redis://\([^:]*\):\([0-9]*\).*|\2|p')

echo "Database: $DB_HOST:$DB_PORT"
echo "Redis: $REDIS_HOST:$REDIS_PORT"

# Wait for PostgreSQL
echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
RETRIES=30
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    echo "ERROR: PostgreSQL is not available after 30 attempts"
    exit 1
  fi
  echo "PostgreSQL not ready, retrying in 2s... ($RETRIES left)"
  sleep 2
done
echo "PostgreSQL is ready!"

# Wait for Redis
echo "Waiting for Redis at $REDIS_HOST:$REDIS_PORT..."
RETRIES=30
until nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    echo "ERROR: Redis is not available after 30 attempts"
    exit 1
  fi
  echo "Redis not ready, retrying in 2s... ($RETRIES left)"
  sleep 2
done
echo "Redis is ready!"

# Worker: NO migrations, just start
echo "Starting Medusa worker (background jobs mode)..."
exec npx medusa start --verbose
