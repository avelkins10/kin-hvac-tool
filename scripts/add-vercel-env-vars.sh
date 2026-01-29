#!/bin/bash
# Print Vercel environment variables to add (Supabase + optional Palmetto/Finance).
# Usage: ./scripts/add-vercel-env-vars.sh
# Add these in Vercel Dashboard → Project → Settings → Environment Variables (or use CLI).

set -e
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Vercel environment variables for this project${NC}"
echo "=============================================="
echo ""
echo "Required (Supabase):"
echo "  NEXT_PUBLIC_SUPABASE_URL     – Supabase project URL"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY – Supabase anon/public key"
echo "  SUPABASE_SERVICE_ROLE_KEY   – Supabase service_role key (secret)"
echo "  DATABASE_URL                 – Supabase Postgres connection string (pooler recommended)"
echo ""
echo "To set DATABASE_URL from .env.local: ./scripts/update-vercel-database-url.sh"
echo ""
echo "Optional (LightReach / Palmetto Finance):"
echo "  PALMETTO_FINANCE_ACCOUNT_EMAIL, PALMETTO_FINANCE_ACCOUNT_PASSWORD, PALMETTO_FINANCE_ENVIRONMENT"
echo "  PALMETTO_SALES_REP_NAME, PALMETTO_SALES_REP_EMAIL, PALMETTO_SALES_REP_PHONE"
echo ""
echo -e "${YELLOW}Redeploy after adding variables.${NC}"
