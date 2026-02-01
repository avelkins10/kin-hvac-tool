#!/usr/bin/env bash
# Add Supabase + DB env vars to Vercel from .env.local.
# Fixes: "Application error: a server-side exception has occurred"
# Usage: ./scripts/sync-vercel-supabase-env.sh

set -e
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "No .env.local found. Create it with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL."
  exit 1
fi

if [[ ! -d .vercel ]]; then
  echo "Project not linked to Vercel. Run: vercel link"
  exit 1
fi

# Read each var from .env.local (avoids 'source' breaking on values with spaces)
get_var() {
  grep -E "^${1}=" .env.local 2>/dev/null | sed "s/^${1}=//" | sed 's/^"//;s/"$//' || true
}

add_var() {
  local name="$1"
  local val
  val="$(get_var "$name")"
  if [[ -z "$val" ]]; then
    echo "Skip $name (not set in .env.local)"
    return
  fi
  for env in production preview development; do
    vercel env rm "$name" "$env" -y 2>/dev/null || true
    echo -n "$val" | vercel env add "$name" "$env" 2>/dev/null && echo "  ✅ $name → $env" || echo "  ⚠ $name → $env (check manually)"
  done
}

echo "Adding required env vars to Vercel (Production, Preview, Development)..."
add_var NEXT_PUBLIC_SUPABASE_URL
add_var NEXT_PUBLIC_SUPABASE_ANON_KEY
add_var DATABASE_URL
add_var SUPABASE_SERVICE_ROLE_KEY
add_var SUPABASE_URL

echo "Done. Redeploy for changes: vercel --prod (or push a commit)."
