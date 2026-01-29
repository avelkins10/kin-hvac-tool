#!/bin/bash
# Setup Supabase Storage Buckets
# Creates nameplates, proposals, agreements, signed-docs buckets and RLS policies.
# Run the SQL in your Supabase project (or use setup-supabase-complete.ts to create buckets via API).

set -e
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Supabase Storage Setup${NC}"
echo "================================"
echo ""
echo "Option A: Run the full setup script (creates buckets via API):"
echo -e "  ${GREEN}npx tsx scripts/setup-supabase-complete.ts${NC}"
echo ""
echo "Option B: Run the SQL manually in Supabase:"
echo "  1. Supabase Dashboard → your project → SQL Editor"
echo "  2. Paste contents of scripts/setup-supabase-storage.sql"
echo "  3. Run the query"
echo ""
echo "Option C: Supabase CLI (if linked):"
echo "  supabase db execute --file scripts/setup-supabase-storage.sql"
echo ""
