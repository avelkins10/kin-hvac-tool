#!/bin/bash
# Script to migrate data from Neon to Supabase
# Usage: ./scripts/migrate-neon-to-supabase.sh

set -e

echo "🔄 Neon to Supabase Migration Script"
echo "======================================"
echo ""

# Check if required tools are installed
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump not found. Please install PostgreSQL client tools."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client tools."
    exit 1
fi

# Get Neon connection string
read -p "Enter your Neon connection string: " NEON_URL
if [ -z "$NEON_URL" ]; then
    echo "❌ Neon connection string is required"
    exit 1
fi

# Get Supabase connection string
read -p "Enter your Supabase connection string (with password): " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Supabase connection string is required"
    exit 1
fi

echo ""
echo "📦 Step 1: Exporting data from Neon..."
pg_dump "$NEON_URL" --no-owner --no-acl --data-only > neon-data-backup.sql

if [ $? -ne 0 ]; then
    echo "❌ Failed to export from Neon"
    exit 1
fi

echo "✅ Data exported to neon-data-backup.sql"
echo ""

echo "📦 Step 2: Exporting schema from Neon..."
pg_dump "$NEON_URL" --schema-only --no-owner --no-acl > neon-schema-backup.sql

if [ $? -ne 0 ]; then
    echo "❌ Failed to export schema from Neon"
    exit 1
fi

echo "✅ Schema exported to neon-schema-backup.sql"
echo ""

echo "📦 Step 3: Importing schema to Supabase..."
psql "$SUPABASE_URL" -f neon-schema-backup.sql

if [ $? -ne 0 ]; then
    echo "⚠️  Schema import had issues (might already exist)"
fi

echo "✅ Schema imported"
echo ""

echo "📦 Step 4: Importing data to Supabase..."
psql "$SUPABASE_URL" -f neon-data-backup.sql

if [ $? -ne 0 ]; then
    echo "❌ Failed to import data to Supabase"
    exit 1
fi

echo "✅ Data imported"
echo ""

echo "📦 Step 5: Verifying migration..."
TABLE_COUNT=$(psql "$SUPABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')

echo "   Found $TABLE_COUNT tables in Supabase"
echo ""

# Count records in key tables
echo "📊 Data verification:"
psql "$SUPABASE_URL" -t -c "SELECT 'User: ' || COUNT(*) FROM \"User\";" | tr -d ' '
psql "$SUPABASE_URL" -t -c "SELECT 'Company: ' || COUNT(*) FROM \"Company\";" | tr -d ' '
psql "$SUPABASE_URL" -t -c "SELECT 'Proposal: ' || COUNT(*) FROM \"Proposal\";" | tr -d ' '
psql "$SUPABASE_URL" -t -c "SELECT 'HVACSystem: ' || COUNT(*) FROM \"HVACSystem\";" | tr -d ' '
psql "$SUPABASE_URL" -t -c "SELECT 'AddOn: ' || COUNT(*) FROM \"AddOn\";" | tr -d ' '

echo ""
echo "✨ Migration complete!"
echo ""
echo "⚠️  Important: Keep Neon as backup for 30 days before deleting"
echo "📝 Next steps:"
echo "   1. Set up storage buckets (run scripts/setup-supabase-storage.sql)"
echo "   2. Update Vercel environment variables"
echo "   3. Test the application"
