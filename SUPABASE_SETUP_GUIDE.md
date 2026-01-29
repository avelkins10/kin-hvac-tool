# Supabase Setup Guide - Step by Step

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `kin-hvac-tool` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (or same as Neon)
   - **Pricing Plan**: Free tier is fine to start

4. Wait for project to provision (2-3 minutes)

## Step 2: Get Connection Details

Once project is ready:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (long string) - **Keep this secret!**

3. Go to **Settings** → **Database**
4. Copy **Connection string** (URI format)
   - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

## Step 3: Set Up Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create these buckets:

### Bucket 1: `nameplates`
- **Public**: No (private)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### Bucket 2: `proposals`
- **Public**: No (private)
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf`

### Bucket 3: `signed-docs`
- **Public**: No (private)
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf`

### Bucket 4: `agreements`
- **Public**: No (private)
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf`

## Step 4: Set Up Storage Policies

For each bucket, create policies:

### Policy: "Users can upload files for their company"
```sql
CREATE POLICY "Users can upload files for their company"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('nameplates', 'proposals', 'signed-docs', 'agreements')
  AND (storage.foldername(name))[1] = (SELECT "companyId"::text FROM auth.users WHERE id = auth.uid())
);
```

### Policy: "Users can read files from their company"
```sql
CREATE POLICY "Users can read files from their company"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('nameplates', 'proposals', 'signed-docs', 'agreements')
  AND (storage.foldername(name))[1] = (SELECT "companyId"::text FROM auth.users WHERE id = auth.uid())
);
```

### Policy: "Public read for proposals with token" (optional)
```sql
CREATE POLICY "Public read for proposals with token"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'proposals'
  -- Add token validation here if needed
);
```

## Step 5: Install Supabase Client

```bash
pnpm add @supabase/supabase-js
```

## Step 6: Environment Variables

Add to Vercel (all environments):

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Step 7: Database Migration

### Option A: Using Prisma (Recommended)

1. Update `.env.local` with Supabase `DATABASE_URL`
2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Verify tables exist in Supabase dashboard

### Option B: Manual Migration

1. Export from Neon:
   ```bash
   pg_dump [neon-connection-string] > backup.sql
   ```

2. Import to Supabase:
   ```bash
   psql [supabase-connection-string] < backup.sql
   ```

## Step 8: Test Connection

Create a test file to verify everything works:

```typescript
// test-supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Test database
const { data, error } = await supabase.from('User').select('count')

// Test storage
const { data: file, error: fileError } = await supabase.storage
  .from('nameplates')
  .list()
```

## Next: Code Integration

Once Supabase is set up, we'll:
1. Create storage utility functions
2. Update file upload code
3. Update PDF generation
4. Add RLS policies
5. Test everything
