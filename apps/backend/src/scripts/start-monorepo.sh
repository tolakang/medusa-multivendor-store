#!/bin/sh
set -e

echo "=== Medusa Backend Starting (mode: $MEDUSA_WORKER_MODE) ==="

DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
REDIS_PORT=$(echo "$REDIS_URL" | sed -n 's|.*:\([0-9]*\)$|\1|p')

DB_PORT=${DB_PORT:-5432}
REDIS_PORT=${REDIS_PORT:-6379}
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
i=0
while [ $i -lt $MAX_RETRIES ]; do
  if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    echo "PostgreSQL is ready!"
    break
  fi
  i=$((i + 1))
  echo "PostgreSQL not ready (attempt $i/$MAX_RETRIES), retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done
if [ $i -eq $MAX_RETRIES ]; then
  echo "ERROR: PostgreSQL not ready after $MAX_RETRIES attempts"
  exit 1
fi

echo "Waiting for Redis at ${REDIS_HOST}:${REDIS_PORT}..."
i=0
while [ $i -lt $MAX_RETRIES ]; do
  if nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; then
    echo "Redis is ready!"
    break
  fi
  i=$((i + 1))
  echo "Redis not ready (attempt $i/$MAX_RETRIES), retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done
if [ $i -eq $MAX_RETRIES ]; then
  echo "ERROR: Redis not ready after $MAX_RETRIES attempts"
  exit 1
fi

MODE="${MEDUSA_WORKER_MODE:-server}"
if [ "$MODE" = "server" ]; then
  echo "Server mode: running migrations..."
  pnpm medusa db:migrate
elif [ "$MODE" = "shared" ]; then
  echo "Shared mode: running migrations..."
  pnpm medusa db:migrate
else
  echo "Worker mode: skipping migrations."
fi

echo "Starting Medusa on port ${PORT:-9000}..."
exec pnpm medusa start --verbose
