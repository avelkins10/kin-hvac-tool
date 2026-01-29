# Neon → Supabase Migration – Final Steps

Use this after schema and storage are set up on Supabase and your app code is already using Supabase Auth and Storage.

## 1. Run data migration

In `.env.local` set:

- `DATABASE_URL` – your **Neon** Postgres connection string (source)
- `SUPABASE_DATABASE_URL` – your **Supabase** Postgres connection string (target)

**Supabase connection string:** Use the **Shared Pooler** (Connection pooling), not the direct connection. The direct connection is "Not IPv4 compatible" and will fail from Vercel and many networks.

In the "Connect to your project" modal, choose **Transaction pooler** → **SHARED POOLER** and copy that URI. For your project it is:
```text
postgresql://postgres.cvhomuxlhinmviwfkkyh:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```
Replace `[YOUR-PASSWORD]` with your database password; if it contains `@`, use `%40`.

Then run:

```bash
npm run migrate-db
# or: npx tsx scripts/migrate-to-supabase.ts
```

Or run migration + create admin in one go:

```bash
./scripts/run-migration-and-admin.sh [email] [password] [company-name]
```

This copies all tables (Company, User, HVACSystem, AddOn, Material, LaborRate, PermitFee, PriceBookUnit, FinancingOption, MaintenancePlan, Incentive, Proposal, ProposalVersion, FinanceApplication, SignatureRequest, Payment, Notification) from Neon to Supabase. It also runs `prisma migrate deploy` against Supabase first. If the schema is already applied on Supabase, run with `SKIP_MIGRATE_DEPLOY=1 npm run migrate-db` to only copy data.

## 2. Create first admin (Supabase Auth)

1. Point `DATABASE_URL` in `.env.local` at **Supabase** (same value as `SUPABASE_DATABASE_URL`). Ensure `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` are set.
2. If the User table was created with the old schema (password column), run migrations on Supabase:
   ```bash
   DATABASE_URL="<your-supabase-pooler-url>" npx prisma migrate deploy
   ```
3. Run:
   ```bash
   npm run create-admin <email> <password> <company-name>
   ```
   The script loads `.env.local` automatically. Example: `npm run create-admin -- you@company.com 'YourPassword!' 'Your Company'`

See `CREATE_FIRST_USER.md` for details.

## 3. Point Vercel at Supabase

**Option A – Dashboard:** Vercel → Project → Settings → Environment Variables → set `DATABASE_URL` to your Supabase Postgres connection string. Redeploy.

**Option B – CLI:** From project root with `SUPABASE_DATABASE_URL` (or `DATABASE_URL`) set to your Supabase connection string:

```bash
./scripts/update-vercel-database-url.sh
```

Then redeploy. Ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set in Vercel.

## Troubleshooting

- **"Tenant or user not found"** or **"Can't reach database server"**: Use the **Transaction pooler** → **SHARED POOLER** connection string (not direct). Format: `postgresql://postgres.cvhomuxlhinmviwfkkyh:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres`.
- **"DATABASE_URL (Neon) not found"**: Set `DATABASE_URL` in `.env.local` to your Neon connection string, or run: `DATABASE_URL=... SUPABASE_DATABASE_URL=... npm run migrate-db`.

## 4. Verify

- Supabase Table Editor: confirm tables and row counts.
- Supabase Storage: confirm buckets (nameplates, proposals, agreements, signed-docs).
- App: log in with the admin created in step 2, then test proposals, file uploads, and admin settings.
