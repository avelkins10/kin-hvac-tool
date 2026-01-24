#!/bin/bash
# Script to set Vercel environment variables via CLI
# Run this after logging in with: vercel login

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting Vercel environment variables...${NC}\n"

# Get the project name from git remote or ask user
PROJECT_NAME=$(git remote get-url origin 2>/dev/null | sed -E 's/.*\/([^/]+)\.git$/\1/' || echo "kin-hvac-tool")

echo "Using project: $PROJECT_NAME"
echo ""

# Required variables
echo -e "${GREEN}Setting DATABASE_URL...${NC}"
vercel env add DATABASE_URL production preview development <<< "postgresql://neondb_owner:npg_W3HUwEXPZ0eC@ep-late-rice-aervqfab-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full"

echo -e "\n${GREEN}Setting NEXTAUTH_SECRET...${NC}"
vercel env add NEXTAUTH_SECRET production preview development <<< "YTlRW8PLwFVqMD/XZw5NAZDs6vdkQlZHA0EHa+IGDas="

echo -e "\n${YELLOW}Setting NEXTAUTH_URL...${NC}"
echo "Note: You'll need to replace 'your-app-name' with your actual Vercel URL"
echo "You can find it in your Vercel dashboard after deployment"
vercel env add NEXTAUTH_URL production preview development

echo -e "\n${GREEN}✅ Environment variables set!${NC}"
echo "Note: Vercel will automatically redeploy your project."
