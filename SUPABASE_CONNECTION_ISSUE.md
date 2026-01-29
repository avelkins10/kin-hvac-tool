# Supabase Connection String Issue

## Problem

Getting "FATAL: Tenant or user not found" error when trying to connect to Supabase database.

## Connection String Format

The connection string provided was:
```
postgresql://postgres.cvhomuxlhinmviwfkkyh:@Mambamentality10@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Attempted Formats

1. **Pooler Transaction Mode (port 6543)**:
   - `postgresql://postgres.cvhomuxlhinmviwfkkyh:%40Mambamentality10@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
   - Result: "Tenant or user not found"

2. **Pooler Session Mode (port 5432)**:
   - `postgresql://postgres.cvhomuxlhinmviwfkkyh:%40Mambamentality10@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
   - Result: "Tenant or user not found"

3. **Direct Connection**:
   - `postgresql://postgres:%40Mambamentality10@db.cvhomuxlhinmviwfkkyh.supabase.co:5432/postgres`
   - Result: "Can't reach database server" (likely needs IPv6)

4. **Password without @ symbol**:
   - `postgresql://postgres.cvhomuxlhinmviwfkkyh:Mambamentality10@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
   - Result: "Tenant or user not found"

## Next Steps

1. **Verify Connection String**: Get the exact connection string from Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/database
   - Click "Connect" button
   - Copy the exact connection string (Session pooler or Transaction pooler)

2. **Check Password**: Verify the database password is correct:
   - The password might not include the `@` symbol
   - Or it might need different URL encoding

3. **Alternative**: Use Supabase SQL Editor to run migrations manually:
   - Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/sql/new
   - Run Prisma migration SQL directly

## Temporary Workaround

For now, we can:
1. Set up storage buckets via SQL Editor (doesn't need connection string)
2. Continue with code updates that don't require database connection
3. Come back to database migration once connection string is verified
