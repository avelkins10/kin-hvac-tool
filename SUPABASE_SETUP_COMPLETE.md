# Supabase Setup - Next Steps

## ✅ Completed

1. **Environment Variables Added to Vercel**
   - `SUPABASE_URL`: `https://cvhomuxlhinmviwfkkyh.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `sb_secret_fxsnM7DxhvfblpRqQ0-idg_skpupFRd`
   - `SUPABASE_DATABASE_URL`: `postgresql://postgres.cvhomuxlhinmviwfkkyh:@Mambamentality10@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
   - All added to Production, Preview, and Development environments

2. **Storage Utility Updated**
   - Now uses `SUPABASE_SERVICE_ROLE_KEY` for server-side operations
   - Configured to bypass RLS (we validate `companyId` in application code)

## ⏳ Next Steps

### Step 1: Set Up Storage Buckets

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/sql/new
2. Copy the entire contents of `scripts/setup-supabase-storage.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see success messages for:
   - 4 storage buckets created (nameplates, proposals, signed-docs, agreements)
   - Helper function created

### Step 2: Migrate Database from Neon to Supabase

**Option A: Use the Migration Script (Recommended)**

```bash
# Set environment variables locally (use your Supabase DB password for SUPABASE_DATABASE_URL)
export DATABASE_URL="your-neon-connection-string"
export SUPABASE_DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.cvhomuxlhinmviwfkkyh.supabase.co:5432/postgres"

# Run migration
npx tsx scripts/migrate-to-supabase.ts
```

**Option B: Manual Migration (if script fails)**

1. Run Prisma migrations on Supabase:
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.cvhomuxlhinmviwfkkyh.supabase.co:5432/postgres" npx prisma migrate deploy
   ```

2. Export data from Neon (using Neon MCP or pg_dump)
3. Import to Supabase

### Step 3: Update DATABASE_URL in Vercel (After Migration)

Once migration is complete and verified:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `DATABASE_URL` to your Supabase direct connection (from Dashboard → Settings → Database):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.cvhomuxlhinmviwfkkyh.supabase.co:5432/postgres
   ```
3. Redeploy your application

### Step 4: Verify Migration

1. Check Supabase Table Editor: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/editor
2. Verify all tables exist and have data
3. Check storage buckets: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/storage/buckets

## 📝 Current Data Count (from Neon)

- **Users**: 3
- **Companies**: 1
- **Proposals**: 4
- **HVAC Systems**: 3
- **Add-Ons**: 6
- **Price Book Units**: 16
- **Labor Rates**: 3
- **Permit Fees**: 3
- **Materials**: 5
- **Financing Options**: 5

All of this data will be migrated to Supabase.

## 🔒 Security Notes

- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS - this is safe because:
  - We validate `companyId` in our application code
  - We use Supabase Auth for authentication; the service role is used only for server-side admin operations (e.g. create user, storage)
  - All file operations check user permissions before accessing storage

## 🚀 After Migration

1. **Run data migration** (with Neon `DATABASE_URL` and `SUPABASE_DATABASE_URL` set):
   ```bash
   npx tsx scripts/migrate-to-supabase.ts
   ```
   This migrates all tables including Payment and Notification.

2. **Create first admin**: See `CREATE_FIRST_USER.md`. Run:
   ```bash
   npm run create-admin <email> <password> <company-name>
   ```
   with `DATABASE_URL` pointing to Supabase and Supabase env vars set.

3. **Point Vercel at Supabase**: In Vercel → Settings → Environment Variables, set `DATABASE_URL` to your Supabase Postgres connection string (same value as `SUPABASE_DATABASE_URL`). Redeploy.

4. **Verify**: Check Supabase Table Editor and Storage buckets; test login, proposals, and file uploads.
