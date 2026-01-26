# Supabase Setup Checklist

## Your Project Details
- **Project Reference**: `cvhomuxlhinmviwfkkyh`
- **Database Connection**: `postgresql://postgres:[YOUR-PASSWORD]@db.cvhomuxlhinmviwfkkyh.supabase.co:5432/postgres`
- **Project URL**: `https://cvhomuxlhinmviwfkkyh.supabase.co`

## Step 1: Get Your Credentials

Go to https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh

### API Keys
1. Go to **Settings** → **API**
2. Copy:
   - ✅ **Project URL**: `https://cvhomuxlhinmviwfkkyh.supabase.co`
   - ✅ **anon public key**: (starts with `eyJ`)
   - ✅ **service_role key**: (starts with `eyJ`) - **Keep secret!**

### Database Password
1. Go to **Settings** → **Database**
2. If you don't know the password, you can reset it
3. Copy the full connection string with password

## Step 2: Set Up Storage Buckets

### Option A: Using SQL (Recommended)

1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the contents of `scripts/setup-supabase-storage.sql`
3. Click **"Run"**
4. This creates all 4 buckets with proper policies

### Option B: Manual Setup

Go to **Storage** → **New bucket** for each:

1. **nameplates**
   - Public: No
   - File size: 5 MB
   - MIME types: `image/jpeg, image/png, image/webp`

2. **proposals**
   - Public: No
   - File size: 10 MB
   - MIME types: `application/pdf`

3. **signed-docs**
   - Public: No
   - File size: 10 MB
   - MIME types: `application/pdf`

4. **agreements**
   - Public: No
   - File size: 10 MB
   - MIME types: `application/pdf`

## Step 3: Migrate Database

### Export from Neon
```bash
# Get your Neon connection string from Neon dashboard
pg_dump "postgresql://user:pass@neon-host/db" > neon-backup.sql
```

### Import to Supabase
```bash
# Use your Supabase connection string
psql "postgresql://postgres:[PASSWORD]@db.cvhomuxlhinmviwfkkyh.supabase.co:5432/postgres" < neon-backup.sql
```

**OR** use Prisma migrations:
```bash
# Update .env.local with Supabase DATABASE_URL
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.cvhomuxlhinmviwfkkyh.supabase.co:5432/postgres

# Run migrations
npx prisma migrate deploy
```

## Step 4: Add Environment Variables to Vercel

Go to Vercel → Settings → Environment Variables:

```
SUPABASE_URL=https://cvhomuxlhinmviwfkkyh.supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.cvhomuxlhinmviwfkkyh.supabase.co:5432/postgres
```

## Step 5: Verify Setup

1. ✅ Check **Table Editor** - all tables should exist
2. ✅ Check **Storage** - 4 buckets should exist
3. ✅ Test query: `SELECT COUNT(*) FROM "User";`
4. ✅ Test storage upload (using code we created)

## Next: Code Integration

Once setup is complete, we'll:
1. Update file upload code to use Supabase Storage
2. Update PDF generation to save files
3. Update document retrieval to use Storage URLs
4. Test everything
