#!/bin/bash
# Run Prisma migrations on Supabase (schema only).
# Usage: ./scripts/run-supabase-migration.sh
# Loads .env.local; requires SUPABASE_DATABASE_URL or DATABASE_URL pointing to Supabase.

set -e
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [[ -f .env.local ]]; then
  set -a
  source .env.local
  set +a
fi

URL="${SUPABASE_DATABASE_URL:-$DATABASE_URL}"
if [ -z "$URL" ]; then
  echo -e "${RED}Error: SUPABASE_DATABASE_URL or DATABASE_URL not set${NC}"
  echo "Add to .env.local. Supabase Dashboard → Project Settings → Database → Connection string (Transaction pooler, port 6543)."
  exit 1
fi

echo -e "${YELLOW}Running Prisma migrations on Supabase...${NC}"
export DATABASE_URL="$URL"
npx prisma migrate deploy

echo ""
echo -e "${GREEN}✅ Migrations completed.${NC}"
echo "Next: Create admin (npm run create-admin) and/or run data migration (npm run migrate-db) if coming from Neon."
