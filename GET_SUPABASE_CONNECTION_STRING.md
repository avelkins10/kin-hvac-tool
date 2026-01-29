# How to Get Supabase Connection String

## Issue

We're getting "Tenant or user not found" error when trying to connect. We need to verify the exact connection string format from your Supabase dashboard.

## Steps to Get Connection String

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh
2. Click **Settings** → **Database** (or click **Connect** button at top)
3. Under **Connection string**, select **Session pooler** (recommended for Prisma migrations)
4. Copy the **exact** connection string shown
5. Verify the format matches one of these:

### Expected Formats:

**Session Pooler (Port 5432)**:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**Transaction Pooler (Port 6543)**:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Direct Connection**:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

## What We Need

Please provide:
1. The **exact** connection string from Supabase dashboard (Session pooler recommended)
2. Confirm the database password (is it `@Mambamentality10` or `Mambamentality10`?)

## Once We Have It

We'll update:
- `scripts/migrate-to-supabase.ts` with correct connection string
- Run Prisma migrations
- Migrate all data from Neon to Supabase
