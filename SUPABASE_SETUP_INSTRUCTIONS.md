# Supabase Setup Instructions

## 1. Storage Buckets Setup

Run the following SQL in your Supabase SQL Editor (Dashboard > SQL Editor):

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'nameplates',
    'nameplates',
    false,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'proposals',
    'proposals',
    false,
    10485760, -- 10 MB
    ARRAY['application/pdf']
  ),
  (
    'signed-docs',
    'signed-docs',
    false,
    10485760, -- 10 MB
    ARRAY['application/pdf']
  ),
  (
    'agreements',
    'agreements',
    false,
    10485760, -- 10 MB
    ARRAY['application/pdf']
  )
ON CONFLICT (id) DO NOTHING;
```

**Note:** The RLS policies in `scripts/setup-supabase-storage.sql` will be added automatically after Supabase Auth migration is complete. For now, we're using the `service_role` key which bypasses RLS.

## 2. Database Migration

### Step 1: Get Supabase Connection String
1. Go to Supabase Dashboard > Settings > Database
2. Copy the connection string (use the "Connection string" tab, "URI" format)
3. Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
4. URL encode special characters in password (e.g., `@` becomes `%40`)

### Step 2: Run Prisma Migrations
```bash
# Set the connection string temporarily
export DATABASE_URL="postgresql://postgres.cvhomuxlhinmviwfkkyh:%40Mambamentality10@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Run migrations
npx prisma migrate deploy
```

### Step 3: Migrate Data (if needed)
```bash
# Run the migration script
npx tsx scripts/migrate-to-supabase.ts
```

## 3. Environment Variables

Add these to Vercel (Project Settings > Environment Variables):

### Required Variables:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://cvhomuxlhinmviwfkkyh.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Get from Supabase Dashboard > Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY` = (Get from Supabase Dashboard > Settings > API)
- `SUPABASE_DATABASE_URL` = (Same as connection string from Step 2.1)

### After Migration:
- Update `DATABASE_URL` to point to Supabase (same as `SUPABASE_DATABASE_URL`)

## 4. Verify Setup

1. Check storage buckets exist in Supabase Dashboard > Storage
2. Verify tables exist: `npx prisma studio` (with Supabase DATABASE_URL)
3. Test file uploads in the app
4. Check that proposals, agreements, and signed docs are being stored
