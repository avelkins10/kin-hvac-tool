# How to Get Supabase Connection String

## Issue

We're getting "Tenant or user not found" error when trying to connect. The connection string format from the Supabase dashboard is critical for the migration to work.

## Steps to Get Connection String

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh
2. Click **Settings** → **Database** (or click **Connect** button at top)
3. Scroll down to **"Connection string"** section
4. **Use the Transaction pooler (port 6543)**, NOT the direct connection
5. Click on **"Transaction"** tab (or "Connection pooling" → "Transaction mode")
6. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password

### Expected Format (Transaction Pooler – Recommended)

Copy the **exact** connection string from your project’s **Settings → Database** (Transaction tab, port 6543). The pooler host depends on your project’s region, e.g.:

- `aws-0-us-east-1.pooler.supabase.com` (US East 1)
- `aws-1-us-east-2.pooler.supabase.com` (US East 2)

Example (replace `[PASSWORD]` and use the host shown in your dashboard):

```
postgresql://postgres.cvhomuxlhinmviwfkkyh:[PASSWORD]@<pooler-host-from-dashboard>:6543/postgres
```

### Alternative: Session Pooler (Port 5432)

```
postgresql://postgres.cvhomuxlhinmviwfkkyh:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Direct Connection (Not recommended – often fails from Vercel/local)

```
postgresql://postgres:[PASSWORD]@db.cvhomuxlhinmviwfkkyh.supabase.co:5432/postgres
```

## Handle Special Characters in Password

If your password contains special characters, **URL-encode** them in the connection string:

| Character | Encoded |
|-----------|---------|
| `@`       | `%40`   |
| `#`       | `%23`   |
| `$`       | `%24`   |
| `%`       | `%25`   |
| `&`       | `%26`   |

**Example:** Password `my@pass#123` → use `my%40pass%23123` in the URI.

## Verify Your Database Password

If you're not sure about your database password:

1. Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/database
2. Scroll to **"Database password"** section
3. Click **"Reset database password"** if needed
4. Save the new password and use it (URL-encoded) in the connection string

## Test the Connection

From project root:

```bash
# Set the connection string (replace with your actual values)
export TEST_DB_URL="postgresql://postgres.cvhomuxlhinmviwfkkyh:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Test with Node.js
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.TEST_DB_URL, ssl: { rejectUnauthorized: false } }); pool.query('SELECT 1').then(() => console.log('✅ Connection successful!')).catch(err => console.error('❌ Connection failed:', err.message)).finally(() => pool.end())"
```

**Expected output:** `✅ Connection successful!`

## Once You Have It

1. Add to `.env.local` as `SUPABASE_DATABASE_URL` (and keep `DATABASE_URL` pointing to Neon for the migration source).
2. Run the migration: `npm run migrate-db`
3. See **SUPABASE_MIGRATION_EXECUTION_GUIDE.md** for the full step-by-step guide.
