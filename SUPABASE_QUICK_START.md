# Supabase Quick Start

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `kin-hvac-tool`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to users
   - **Plan**: Free tier is fine

4. Wait 2-3 minutes for provisioning

## Step 2: Get Your Credentials

Once project is ready, go to **Settings** → **API** and copy:

- ✅ **Project URL**: `https://xxxxx.supabase.co`
- ✅ **anon public key**: `eyJhbGc...` (starts with `eyJ`)
- ✅ **service_role key**: `eyJhbGc...` (keep secret!)

Then go to **Settings** → **Database** and copy:
- ✅ **Connection string** (URI format)

## Step 3: Set Up Storage (Using Supabase Dashboard)

1. Go to **Storage** in Supabase dashboard
2. Click **"New bucket"** for each:

### Bucket: `nameplates`
- **Public bucket**: ❌ No
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### Bucket: `proposals`
- **Public bucket**: ❌ No
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf`

### Bucket: `signed-docs`
- **Public bucket**: ❌ No
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf`

### Bucket: `agreements`
- **Public bucket**: ❌ No
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf`

## Step 4: Run Storage Setup SQL

1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the contents of `scripts/setup-supabase-storage.sql`
3. Click **"Run"**
4. This creates the buckets and sets up access policies

## Step 5: Add Environment Variables to Vercel

Go to Vercel → Settings → Environment Variables and add:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Also update**:
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Step 6: Migrate Database

### Option A: Using Prisma (Easiest)

1. Update your local `.env.local` with Supabase `DATABASE_URL`
2. Run:
   ```bash
   npx prisma migrate deploy
   ```
3. This will create all your tables in Supabase

### Option B: Export/Import from Neon

1. Export from Neon:
   ```bash
   pg_dump [neon-connection-string] > backup.sql
   ```

2. Import to Supabase:
   ```bash
   psql [supabase-connection-string] < backup.sql
   ```

## Step 7: Verify Setup

1. Check **Table Editor** in Supabase - you should see all your tables
2. Check **Storage** - you should see 4 buckets
3. Test a simple query in **SQL Editor**:
   ```sql
   SELECT COUNT(*) FROM "User";
   ```

## Next Steps

Once Supabase is set up:
1. ✅ Code is ready (`lib/storage/supabase-storage.ts` created)
2. ⏳ Update file upload code to use Supabase Storage
3. ⏳ Update PDF generation to save to Storage
4. ⏳ Test file uploads and retrieval

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Storage Docs: https://supabase.com/docs/guides/storage
- MCP Tools: If you have Supabase MCP configured, I can help automate some of this!
