#!/usr/bin/env bash
# Run full Neon→Supabase migration then create first admin (or create admin only if already on Supabase).
# Usage: ./scripts/run-migration-and-admin.sh [email] [password] [company-name]
# Requires .env.local with Supabase vars. For step 1 (migrate-db) also set DATABASE_URL (Neon) and SUPABASE_DATABASE_URL.

set -e
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a
  source .env.local
  set +a
  echo "Loaded .env.local"
else
  echo "No .env.local found. Create it with SUPABASE_DATABASE_URL, SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY."
  exit 1
fi

SUPABASE_DB="${SUPABASE_DATABASE_URL:-$DATABASE_URL}"
if [[ -z "$SUPABASE_DB" ]]; then
  echo "❌ SUPABASE_DATABASE_URL or DATABASE_URL (Supabase) not set in .env.local"
  exit 1
fi

# Step 1: Data migration only if user has both Neon (source) and Supabase (target)
if [[ -n "$DATABASE_URL" && -n "$SUPABASE_DATABASE_URL" && "$DATABASE_URL" != "$SUPABASE_DATABASE_URL" ]] && [[ "$DATABASE_URL" == *"neon"* ]]; then
  echo ""
  echo "Step 1: Running data migration (Neon → Supabase)..."
  npm run migrate-db
else
  echo ""
  echo "Step 1: Skipping data migration (DATABASE_URL not Neon or same as SUPABASE_DATABASE_URL)."
fi

echo ""
echo "Step 2: Creating first admin user on Supabase..."
export DATABASE_URL="$SUPABASE_DB"
EMAIL="${1:-admin@example.com}"
PASS="${2:-Admin123!}"
COMPANY="${3:-Default Company}"
npm run create-admin "$EMAIL" "$PASS" "$COMPANY"

echo ""
echo "✅ Done."
echo "Next: Point Vercel DATABASE_URL to Supabase and redeploy. Run: ./scripts/update-vercel-database-url.sh"
