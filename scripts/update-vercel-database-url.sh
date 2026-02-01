#!/usr/bin/env bash
# Update Vercel DATABASE_URL to Supabase (after migration).
# Usage: SUPABASE_DATABASE_URL='postgresql://...' ./scripts/update-vercel-database-url.sh
# Or: ./scripts/update-vercel-database-url.sh   (will prompt or use .env.local)

set -e
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a
  source .env.local
  set +a
fi

URL="${SUPABASE_DATABASE_URL:-$DATABASE_URL}"
if [[ -z "$URL" ]]; then
  echo "Set SUPABASE_DATABASE_URL or DATABASE_URL (Supabase connection string), or add to .env.local"
  exit 1
fi
if [[ "$URL" == *"neon.tech"* ]]; then
  echo "Warning: URL looks like Neon. For Vercel after migration, use Supabase pooler URL."
  echo "Set SUPABASE_DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@...pooler.supabase.com:6543/postgres"
  read -p "Continue anyway? [y/N] " -n 1 -r; echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

if ! command -v vercel &> /dev/null; then
  echo "Vercel CLI not found. Run: npm i -g vercel"
  exit 1
fi

if [[ ! -d .vercel ]]; then
  echo "Project not linked to Vercel. Run from project root: vercel link"
  echo "Then run this script again: ./scripts/update-vercel-database-url.sh"
  exit 1
fi

echo "Updating DATABASE_URL in Vercel (production, preview, development)..."
for env in production preview development; do
  echo "$URL" | vercel env rm DATABASE_URL "$env" -y 2>/dev/null || true
  echo "$URL" | vercel env add DATABASE_URL "$env"
done
echo "Done. Redeploy for changes to take effect: vercel --prod"
