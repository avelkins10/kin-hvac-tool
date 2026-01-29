# Scripts (Supabase)

All scripts assume `.env.local` exists with the required variables. They load `.env.local` automatically (no `dotenv` needed).

## Supabase setup and migration

| Script | Purpose |
|--------|--------|
| `setup-supabase-complete.ts` | Create storage buckets, run Prisma migrations, verify. Run once for a new Supabase project. `npm run supabase:setup` |
| `run-supabase-migration.sh` | Run Prisma migrations on Supabase only. `npm run db:migrate:supabase` |
| `migrate-to-supabase.ts` | Copy data from Neon to Supabase (after schema is on Supabase). Requires `DATABASE_URL` (Neon) and `SUPABASE_DATABASE_URL`. `npm run migrate-db` |
| `run-migration-and-admin.sh` | Optionally run migrate-db (if Neon source), then create first admin on Supabase. `./scripts/run-migration-and-admin.sh [email] [password] [company]` |
| `create-admin-user.ts` | Create or update a Supabase Auth admin and link to DB User. `npm run create-admin -- email password company` |

## Database and seeding

| Script | Purpose |
|--------|--------|
| `seed-admin-defaults.ts` | Seed default HVAC systems, add-ons, price book, labor rates, permits, materials, financing. `npm run seed` |
| `run-migrations.sh` | Run Prisma migrate deploy with retries (e.g. for Vercel build). |

## Vercel

| Script | Purpose |
|--------|--------|
| `update-vercel-database-url.sh` | Set `DATABASE_URL` in Vercel from `SUPABASE_DATABASE_URL` or `DATABASE_URL` in `.env.local`. `./scripts/update-vercel-database-url.sh` |
| `add-vercel-env-vars.sh` | Print list of Vercel env vars to add (Supabase + optional Palmetto). `./scripts/add-vercel-env-vars.sh` |

## Storage

| Script | Purpose |
|--------|--------|
| `setup-supabase-storage.sh` | Instructions for creating buckets (run SQL or use `supabase:setup`). |
| `setup-supabase-storage.sql` | SQL for buckets and RLS; run in Supabase SQL Editor if not using `supabase:setup`. |

## One-time / alternative

| Script | Purpose |
|--------|--------|
| `migrate-neon-to-supabase.sh` | pg_dump/psql migration. Prefer `npm run migrate-db` (TypeScript script). |

## Required .env.local (Supabase)

- `DATABASE_URL` – Supabase Postgres (pooler recommended; use after migration).
- `SUPABASE_DATABASE_URL` – Same as above; used by migrate script as target.
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` – Service role key (create-admin, setup).

For Neon → Supabase migration, also set `DATABASE_URL` to Neon during `migrate-db`, then switch `DATABASE_URL` to Supabase for everything else.
