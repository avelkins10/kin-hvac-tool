#!/usr/bin/env bash
# Add Supabase env vars to Vercel from .env.local (fixes build: "Your project's URL and API key are required").
# Usage: ./scripts/sync-vercel-supabase-env.sh

set -e
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "No .env.local found. Create it with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL."
  exit 1
fi

if [[ ! -d .vercel ]]; then
  echo "Project not linked to Vercel. Run: vercel link"
  exit 1
fi

set -a
source .env.local
set +a

add_var() {
  local name="$1"
  local val="${!name}"
  if [[ -z "$val" ]]; then
    echo "Skip $name (not set in .env.local)"
    return
  fi
  for env in production preview development; do
    echo "$val" | vercel env rm "$name" "$env" -y 2>/dev/null || true
    echo "$val" | vercel env add "$name" "$env" 2>/dev/null && echo "  ✅ $name → $env" || echo "  ⚠ $name → $env (check manually)"
  done
}

echo "Adding Supabase env vars to Vercel..."
add_var NEXT_PUBLIC_SUPABASE_URL
add_var NEXT_PUBLIC_SUPABASE_ANON_KEY
add_var SUPABASE_SERVICE_ROLE_KEY
add_var SUPABASE_URL

echo "Done. Redeploy: vercel --prod"
