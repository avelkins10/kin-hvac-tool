#!/bin/bash
# Script to add LightReach/Palmetto Finance environment variables to Vercel
# Usage: ./scripts/add-vercel-env-vars.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Adding LightReach/Palmetto Finance environment variables to Vercel...${NC}\n"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Required variables
echo "Adding required environment variables..."

vercel env add PALMETTO_FINANCE_ACCOUNT_EMAIL production <<< "scott@kinhome.com"
vercel env add PALMETTO_FINANCE_ACCOUNT_EMAIL preview <<< "scott@kinhome.com"
vercel env add PALMETTO_FINANCE_ACCOUNT_EMAIL development <<< "scott@kinhome.com"

vercel env add PALMETTO_FINANCE_ACCOUNT_PASSWORD production <<< "Lionhive1!"
vercel env add PALMETTO_FINANCE_ACCOUNT_PASSWORD preview <<< "Lionhive1!"
vercel env add PALMETTO_FINANCE_ACCOUNT_PASSWORD development <<< "Lionhive1!"

vercel env add PALMETTO_FINANCE_ENVIRONMENT production <<< "next"
vercel env add PALMETTO_FINANCE_ENVIRONMENT preview <<< "next"
vercel env add PALMETTO_FINANCE_ENVIRONMENT development <<< "next"

# Recommended variables
echo "Adding recommended environment variables..."

vercel env add PALMETTO_SALES_REP_NAME production <<< "Austin Elkins"
vercel env add PALMETTO_SALES_REP_NAME preview <<< "Austin Elkins"
vercel env add PALMETTO_SALES_REP_NAME development <<< "Austin Elkins"

vercel env add PALMETTO_SALES_REP_EMAIL production <<< "austin@kinhome.com"
vercel env add PALMETTO_SALES_REP_EMAIL preview <<< "austin@kinhome.com"
vercel env add PALMETTO_SALES_REP_EMAIL development <<< "austin@kinhome.com"

vercel env add PALMETTO_SALES_REP_PHONE production <<< "801-928-6369"
vercel env add PALMETTO_SALES_REP_PHONE preview <<< "801-928-6369"
vercel env add PALMETTO_SALES_REP_PHONE development <<< "801-928-6369"

echo -e "\n${GREEN}✅ Environment variables added successfully!${NC}"
echo -e "${YELLOW}Note: You may need to redeploy your project for changes to take effect.${NC}"
