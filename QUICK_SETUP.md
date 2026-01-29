# Quick Supabase Setup

## Option 1: Automated Script (Recommended)

Run this single command with your Supabase credentials:

```bash
SUPABASE_URL=https://cvhomuxlhinmviwfkkyh.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
SUPABASE_DATABASE_URL='postgresql://postgres.cvhomuxlhinmviwfkkyh:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres' \
npx tsx scripts/setup-supabase-complete.ts
```

**To get your credentials:**
1. Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/api
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/database
4. Copy **Connection string** → `SUPABASE_DATABASE_URL`

## Option 2: Manual Steps

### 1. Create Storage Buckets

Go to Supabase SQL Editor: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/sql/new

Copy and run the SQL from `scripts/setup-supabase-storage.sql`

### 2. Run Database Migrations

```bash
export SUPABASE_DATABASE_URL='postgresql://postgres.cvhomuxlhinmviwfkkyh:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
export DATABASE_URL="$SUPABASE_DATABASE_URL"
npx prisma migrate deploy
```

### 3. Add Environment Variables to Vercel

Go to: Vercel Dashboard → Project Settings → Environment Variables

Add:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://cvhomuxlhinmviwfkkyh.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Supabase Dashboard > Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase Dashboard > Settings > API)
- `SUPABASE_DATABASE_URL` = (connection string)

## What Gets Set Up

✅ 4 Storage Buckets:
- `nameplates` (5 MB, images only)
- `proposals` (10 MB, PDFs only)
- `signed-docs` (10 MB, PDFs only)
- `agreements` (10 MB, PDFs only)

✅ Database Schema:
- All Prisma migrations applied
- All tables created with relationships

✅ Verification:
- Checks buckets exist
- Checks tables exist
- Reports any issues
