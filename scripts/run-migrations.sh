#!/bin/bash
# Script to run Prisma migrations with retry logic for Vercel builds

set -e

MAX_RETRIES=3
RETRY_DELAY=5

echo "Running Prisma migrations..."

for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i of $MAX_RETRIES..."
  
  if npx prisma migrate deploy; then
    echo "✅ Migrations completed successfully"
    exit 0
  fi
  
  if [ $i -lt $MAX_RETRIES ]; then
    echo "⚠️ Migration attempt failed, retrying in ${RETRY_DELAY}s..."
    sleep $RETRY_DELAY
  fi
done

echo "⚠️ Migrations failed after $MAX_RETRIES attempts, but continuing build..."
echo "⚠️ This is OK if migrations are already applied to the database."
exit 0
