# Supabase Migration Execution Guide - kin-hvac-tool

**Project:** kin-hvac-tool  
**Status:** Code migration 100% complete, infrastructure migration pending  
**Estimated Time:** 30-45 minutes  
**Current Blocker:** Database connection string issue

---

## Overview

Your code is fully migrated to Supabase! All authentication, storage, and API code uses Supabase. What remains is the **infrastructure setup**:

1. ✅ **Code Migration** - COMPLETE
2. ⏳ **Storage Buckets** - Need to create 4 buckets
3. ⏳ **Database Migration** - Need to migrate data from Neon to Supabase
4. ⏳ **Environment Variables** - Need to configure Vercel
5. ⏳ **Admin User Creation** - Need to create first Supabase Auth user

---

## Prerequisites

Before starting, ensure you have:

- ✅ Supabase account created
- ✅ Supabase project created (ID: `cvhomuxlhinmviwfkkyh`)
- ✅ Access to Supabase Dashboard: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh
- ✅ Access to Vercel Dashboard for your project
- ✅ Terminal access to your local project

---

## Step 1: Get Correct Supabase Connection String (10 minutes)

**This is the main blocker.** The connection string format is critical for the migration to work.

### 1.1 Navigate to Database Settings

1. Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/database
2. Scroll down to **"Connection string"** section
3. You'll see multiple connection options

### 1.2 Get the Transaction Pooler Connection String

**Important:** Use the **Transaction pooler** (port 6543), NOT the direct connection.

1. Click on **"Transaction"** tab (or "Connection pooling" → "Transaction mode")
2. You should see a connection string like:
   ```
   postgresql://postgres.cvhomuxlhinmviwfkkyh:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
3. **Replace `[YOUR-PASSWORD]`** with your actual database password

### 1.3 Handle Special Characters in Password

If your password contains special characters, you need to URL-encode them:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

**Example:**
- Password: `my@pass#123`
- Encoded: `my%40pass%23123`
- Full connection string:
  ```
  postgresql://postgres.cvhomuxlhinmviwfkkyh:my%40pass%23123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
  ```

### 1.4 Verify Your Database Password

If you're not sure about your database password:

1. Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/database
2. Scroll to **"Database password"** section
3. Click **"Reset database password"** if needed
4. **Save the new password** - you'll need it for the connection string

### 1.5 Test the Connection String

Before proceeding, test the connection string:

```bash
# From project root
export TEST_DB_URL="postgresql://postgres.cvhomuxlhinmviwfkkyh:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Test connection using psql (if installed)
psql "$TEST_DB_URL" -c "SELECT 1"

# Or test with Node.js
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.TEST_DB_URL, ssl: { rejectUnauthorized: false } }); pool.query('SELECT 1').then(() => console.log('✅ Connection successful!')).catch(err => console.error('❌ Connection failed:', err.message)).finally(() => pool.end())"
```

**Expected output:** `✅ Connection successful!`

If you get an error, double-check:
- Password is correct
- Special characters are URL-encoded
- Using port 6543 (Transaction pooler)
- Using the correct project reference (`cvhomuxlhinmviwfkkyh`)

---

## Step 2: Set Up Storage Buckets (5 minutes)

Storage buckets are needed for nameplate photos, proposal PDFs, agreements, and signed documents.

### 2.1 Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/sql/new
2. You should see a blank SQL editor

### 2.2 Run Storage Setup SQL

1. Open the file: `scripts/setup-supabase-storage.sql`
2. Copy the **entire contents** of the file
3. Paste into the Supabase SQL Editor
4. Click **"Run"** button (or press Cmd/Ctrl + Enter)

### 2.3 Verify Buckets Created

1. Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/storage/buckets
2. You should see 4 buckets:
   - ✅ `nameplates` (5 MB limit, images only)
   - ✅ `proposals` (10 MB limit, PDFs only)
   - ✅ `signed-docs` (10 MB limit, PDFs only)
   - ✅ `agreements` (10 MB limit, PDFs only)

**Note:** The RLS policies are created but won't be enforced yet because you're using the `service_role` key in your code (which bypasses RLS). This is safe because your application code validates `companyId` access.

---

## Step 3: Update Environment Variables (5 minutes)

You need to add Supabase credentials to your local `.env.local` file.

### 3.1 Get Supabase API Keys

1. Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/api
2. You'll see three keys:
   - **Project URL** (e.g., `https://cvhomuxlhinmviwfkkyh.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3.2 Update `.env.local`

Open `.env.local` and add/update these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cvhomuxlhinmviwfkkyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Your anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...      # Your service_role key

# Database URLs
DATABASE_URL=postgresql://postgres:[NEON_PASSWORD]@[NEON_HOST]/[NEON_DB]  # Keep Neon for now (source)
SUPABASE_DATABASE_URL=postgresql://postgres.cvhomuxlhinmviwfkkyh:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres  # Supabase (target)
```

**Important:**
- Keep `DATABASE_URL` pointing to **Neon** (source database)
- Set `SUPABASE_DATABASE_URL` to your **Supabase** connection string (target database)
- Use the connection string from Step 1 with URL-encoded password

### 3.3 Verify Environment Variables

```bash
npm run verify-migration-env
# Or:
node -e "require('dotenv').config({ path: '.env.local' }); console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL); console.log('SUPABASE_DATABASE_URL:', process.env.SUPABASE_DATABASE_URL ? '✅ Set' : '❌ Not set')"
```

---

## Step 4: Run Database Migration (10-15 minutes)

This step migrates all data from Neon to Supabase.

### 4.1 Verify Prerequisites

Before running the migration:

```bash
npm run verify-migration-env
# Or verify both database URLs are set:
node -e "require('dotenv').config({ path: '.env.local' }); if (!process.env.DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); } if (!process.env.SUPABASE_DATABASE_URL) { console.error('❌ SUPABASE_DATABASE_URL not set'); process.exit(1); } console.log('✅ Both database URLs are set')"
```

### 4.2 Run the Migration Script

The migration script will:
1. Run Prisma migrations on Supabase (create schema)
2. Copy all data from Neon to Supabase (18 tables)
3. Verify the migration

```bash
npm run migrate-db

# Or run directly with tsx
npx tsx scripts/migrate-to-supabase.ts
```

**Expected output:**
```
🔄 Starting migration from Neon to Supabase...

📦 Step 1: Running Prisma migrations on Supabase...
✅ Schema migrated

📦 Step 2: Connecting to databases...
📦 Step 3: Migrating data...

  Migrating Company...
    ✅ Migrated 1 companies
  Migrating User...
    ✅ Migrated 3 users
  ... (continues for all 18 tables)

✨ Migration complete!

📝 Next steps:
   1. Set up storage buckets (run scripts/setup-supabase-storage.sql in Supabase SQL Editor)
   2. Get API keys from Supabase dashboard
   3. Update Vercel environment variables
   4. Test the application
```

### 4.3 Troubleshooting Migration Errors

**Error: "Tenant or user not found"**
- Go back to Step 1 and verify your connection string
- Make sure you're using the Transaction pooler (port 6543)
- Verify password is URL-encoded correctly

**Error: "Schema already exists"**
- If the schema is already applied on Supabase, run:
  ```bash
  SKIP_MIGRATE_DEPLOY=1 npm run migrate-db
  ```

**Error: "Authentication failed"**
- Reset your database password in Supabase Dashboard
- Update the connection string with the new password

### 4.4 Verify Migration Success

1. Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/editor
2. Click on **"Table Editor"**
3. Verify all tables exist and have data:
   - Company (should have 1+ rows)
   - User (should have 3+ rows)
   - HVACSystem, AddOn, Material, etc.
   - Proposal, ProposalVersion
   - FinanceApplication, SignatureRequest

---

## Step 5: Create First Admin User (5 minutes)

Now that the database is migrated, create your first Supabase Auth user.

### 5.1 Update DATABASE_URL to Point to Supabase

**Important:** Before creating the admin user, point `DATABASE_URL` to Supabase (not Neon).

Edit `.env.local`:

```bash
# Change this:
DATABASE_URL=postgresql://postgres:[NEON_PASSWORD]@[NEON_HOST]/[NEON_DB]

# To this (same as SUPABASE_DATABASE_URL):
DATABASE_URL=postgresql://postgres.cvhomuxlhinmviwfkkyh:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 5.2 Run Admin User Creation Script

```bash
npm run create-admin -- your-email@example.com 'YourPassword123!' 'Your Company Name'

# Or run directly
npx tsx scripts/create-admin-user.ts your-email@example.com 'YourPassword123!' 'Your Company Name'
```

**Example:**
```bash
npm run create-admin -- admin@company.com 'SecurePass123!' 'Kin HVAC'
```

**Expected output:**
```
Using existing company: Kin HVAC (clxxx...)
Creating Supabase Auth user...
Created Supabase Auth user: abc123-def456-...
Created admin user: admin@company.com (clyyy...)

✅ Admin user created/updated successfully!
Email: admin@company.com
Password: SecurePass123!
Company: Kin HVAC

📝 Note: User can now log in using Supabase Auth
```

### 5.3 Verify Admin User in Supabase

1. Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/auth/users
2. You should see your admin user listed
3. Email should be confirmed (green checkmark)

---

## Step 6: Update Vercel Environment Variables (5 minutes)

Now that everything works locally, update Vercel to use Supabase.

### 6.1 Add Supabase Variables to Vercel

**Option A: Using Vercel Dashboard**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables (for **Production**, **Preview**, and **Development**):

```
NEXT_PUBLIC_SUPABASE_URL = https://cvhomuxlhinmviwfkkyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [Your anon key from Step 3]
SUPABASE_SERVICE_ROLE_KEY = [Your service_role key from Step 3]
DATABASE_URL = postgresql://postgres.cvhomuxlhinmviwfkkyh:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link project (if not already linked)
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://cvhomuxlhinmviwfkkyh.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste your anon key

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste your service_role key

vercel env add DATABASE_URL production
# Paste your Supabase connection string
```

### 6.2 Redeploy to Vercel

After adding environment variables, trigger a new deployment:

**Option A: Push to Git**
```bash
git add .
git commit -m "Complete Supabase migration"
git push origin main
```

**Option B: Manual Deploy**
```bash
vercel --prod
```

---

## Step 7: Verification & Testing (10 minutes)

Test that everything works end-to-end.

### 7.1 Test Local Development

```bash
npm run dev
```

1. Open http://localhost:3000
2. Navigate to `/auth/signin`
3. Log in with the admin credentials from Step 5
4. Verify you can access the dashboard

### 7.2 Test Authentication

- ✅ Login works with Supabase Auth
- ✅ Session persists across page refreshes
- ✅ Middleware redirects unauthenticated users
- ✅ User info displays correctly in navigation

### 7.3 Test Storage

1. Go to **Builder** page
2. Upload a nameplate photo
3. Verify it uploads to Supabase Storage:
   - Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/storage/buckets/nameplates
   - You should see the uploaded file

### 7.4 Test Database Operations

1. Go to **Admin Settings**
2. Create a new HVAC system or add-on
3. Verify it saves to Supabase:
   - Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/editor
   - Check the relevant table for the new record

### 7.5 Test Proposal Creation

1. Create a new proposal
2. Send the proposal (generates PDF)
3. Verify PDF is stored in Supabase Storage:
   - Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/storage/buckets/proposals

### 7.6 Test Production Deployment

1. Visit your Vercel production URL
2. Repeat tests from 7.2-7.5
3. Verify everything works in production

---

## Step 8: Cleanup (Optional)

Once everything is verified and working:

### 8.1 Remove NextAuth API Route

The NextAuth API route has been removed; the app uses Supabase Auth only.

### 8.2 Update Documentation

README.md has been updated to reflect the Supabase stack.

### 8.3 Archive Neon Database (Optional)

Once you're confident everything works:

1. Keep Neon database for 1-2 weeks as backup
2. After verification period, you can delete the Neon project
3. Remove `NEON_DATABASE_URL` from environment variables

---

## Troubleshooting

### Connection String Issues

**Problem:** "Tenant or user not found"

**Solutions:**
1. Use Transaction pooler (port 6543), not direct connection
2. Verify password is correct (reset if needed)
3. URL-encode special characters in password
4. Try Session pooler (port 5432) if Transaction pooler fails

**Problem:** "Can't reach database server"

**Solutions:**
1. Don't use direct connection (requires IPv6)
2. Use pooler connection instead
3. Check firewall/network settings

### Migration Script Errors

**Problem:** "DATABASE_URL not found"

**Solution:**
```bash
# Set explicitly
DATABASE_URL="postgresql://..." SUPABASE_DATABASE_URL="postgresql://..." npm run migrate-db
```

**Problem:** "Schema already exists"

**Solution:**
```bash
# Skip schema migration, only copy data
SKIP_MIGRATE_DEPLOY=1 npm run migrate-db
```

### Storage Upload Errors

**Problem:** "Bucket not found"

**Solution:**
1. Verify buckets exist in Supabase Dashboard
2. Re-run `scripts/setup-supabase-storage.sql`

**Problem:** "Permission denied"

**Solution:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Check that storage code uses service_role client (not anon client)

### Authentication Errors

**Problem:** "User not found"

**Solution:**
1. Verify admin user was created in Supabase Auth
2. Check `supabaseUserId` field in User table matches Auth user ID

**Problem:** "Session expired"

**Solution:**
1. Clear browser cookies
2. Log out and log back in
3. Verify middleware is using Supabase Auth helpers

---

## Success Criteria

✅ **Migration Complete When:**

1. ✅ All 4 storage buckets created in Supabase
2. ✅ All 18 database tables migrated from Neon to Supabase
3. ✅ Admin user created in Supabase Auth
4. ✅ Can log in with Supabase Auth credentials
5. ✅ Nameplate photos upload to Supabase Storage
6. ✅ Proposals generate and store PDFs in Supabase Storage
7. ✅ All CRUD operations work (create/read/update/delete)
8. ✅ Vercel deployment uses Supabase environment variables
9. ✅ Production site works with Supabase

---

## Quick Reference

### Connection Strings

**Transaction Pooler (Recommended):**
```
postgresql://postgres.cvhomuxlhinmviwfkkyh:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Session Pooler (Alternative):**
```
postgresql://postgres.cvhomuxlhinmviwfkkyh:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Key Commands

```bash
# Verify env (before migration)
npm run verify-migration-env

# Run migration
npm run migrate-db

# Create admin user
npm run create-admin -- email@example.com 'Password123!' 'Company Name'

# Deploy to Vercel
vercel --prod
```

### Important URLs

- **Supabase Dashboard:** https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh
- **Database Settings:** https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/database
- **API Keys:** https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/api
- **Storage Buckets:** https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/storage/buckets
- **Auth Users:** https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/auth/users
- **SQL Editor:** https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/sql/new

---

## Next Steps After Migration

Once the migration is complete, you can:

1. **Continue Development** - Build remaining features using Supabase
2. **Optimize Performance** - Add database indexes, optimize queries
3. **Implement RLS** - Transition from service_role to authenticated client with RLS
4. **Add Real-time Features** - Use Supabase real-time subscriptions
5. **Set Up Edge Functions** - Move webhooks to Supabase Edge Functions

---

## Support

If you encounter issues during migration:

1. Check the **Troubleshooting** section above
2. Review migration status files:
   - `SUPABASE_MIGRATION_STATUS.md`
   - `MIGRATION_FINAL_STEPS.md`
   - `COMPLETED_TASKS.md`
3. Verify environment variables with `npm run verify-migration-env`
4. Test connection string independently before running migration
