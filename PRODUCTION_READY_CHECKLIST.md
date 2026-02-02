# Production-Ready Checklist (Before Commit & Push)

Use this **before** committing and pushing to production. Ensures migrations, database, and LightReach are correct.

---

## 1. Migrations & database

### Migrations on disk
- [ ] All migrations are in `prisma/migrations/` and committed:
  - `20260124020937_init`
  - `20260124000000_add_external_application_id`
  - `20260126000000_user_supabase_auth`
  - **`20260202000000_user_lightreach_sales_rep`** (User LightReach sales rep columns)

### Production database
- [ ] **Production `DATABASE_URL`** in Vercel (Production env) points to your **production** Supabase (or production Postgres). Not a staging/dev URL.
- [ ] Pending migrations run on deploy: Vercel build runs `pnpm run build` → `prisma migrate deploy`. So the **production** DB will get any pending migrations when you deploy. No need to run migrations manually first unless you prefer to.
- [ ] If you previously applied `20260202000000_user_lightreach_sales_rep` manually (e.g. Supabase SQL Editor), that’s fine; `migrate deploy` will mark it applied and not re-run it.

### Quick local check (optional)
```bash
# Ensure schema matches migrations (no drift)
pnpm exec prisma migrate status
# Should show: "Database schema is up to date with the migration history."
```

---

## 2. LightReach: production vs sandbox

For **production** you must use the real Palmetto API and **not** sandbox/test mode.

### Environment variables (Vercel → Production)

| Variable | Production value | Notes |
|---------|------------------|--------|
| `PALMETTO_FINANCE_ENVIRONMENT` | **`prod`** | Use `prod` (or `production`) for production. `next` = staging/sandbox. |
| `PALMETTO_FINANCE_ACCOUNT_EMAIL` | Your production service account email | From Palmetto for **production**. |
| `PALMETTO_FINANCE_ACCOUNT_PASSWORD` | Your production service account password | From Palmetto for **production**. |
| `ENABLE_FINANCE_TEST_MODE` | **Unset** or **`false`** | Must not be `true` in production or you’ll get mock responses only. |

### Checklist
- [ ] In Vercel, **Production** environment variables:
  - [ ] `PALMETTO_FINANCE_ENVIRONMENT` = **`prod`** (not `next`).
  - [ ] `PALMETTO_FINANCE_ACCOUNT_EMAIL` and `PALMETTO_FINANCE_ACCOUNT_PASSWORD` are the **production** Palmetto credentials (not staging).
  - [ ] `ENABLE_FINANCE_TEST_MODE` is **not** set, or is explicitly **`false`**.
- [ ] Do **not** rely on `.env.local` for production; production uses only Vercel env vars.

### Optional (URLs)
If you don’t set these, the app uses defaults from `PALMETTO_FINANCE_ENVIRONMENT`:
- `PALMETTO_FINANCE_BASE_URL` – default prod: `https://palmetto.finance`
- `PALMETTO_FINANCE_AUTH_URL` – default prod: `https://palmetto.finance/api/auth/login`

---

## 3. Secrets & .env

- [ ] **`.env` and `.env.local` are not committed.** (They are in `.gitignore`; confirm with `git status` before commit.)
- [ ] No secrets or API keys are hardcoded in the repo.
- [ ] Production secrets exist only in Vercel (Production) environment variables.

---

## 4. Build & deploy

- [ ] `vercel.json` uses `"buildCommand": "pnpm run build"` so the build runs `prisma generate`, `prisma migrate deploy`, and `next build`.
- [ ] After push, trigger a **production** deploy (e.g. push to `main` if production branch, or “Promote to Production” in Vercel).
- [ ] After deploy, run through `PRODUCTION_VERIFICATION_CHECKLIST.md` (login, proposals, LightReach apply, etc.).

---

## 5. Quick pre-push commands

```bash
# 1. No uncommitted .env / .env.local
git status
# Ensure no .env or .env.local are staged.

# 2. Build (and migrations) succeed
pnpm run build

# 3. Lint
pnpm run lint
```

---

## Summary

| Area | Action |
|------|--------|
| **Migrations** | In repo and applied on deploy via `prisma migrate deploy`; production DB = Vercel production `DATABASE_URL`. |
| **LightReach** | Vercel Production: `PALMETTO_FINANCE_ENVIRONMENT=prod`, real prod credentials, `ENABLE_FINANCE_TEST_MODE` unset or `false`. |
| **Secrets** | Only in Vercel; no `.env`/`.env.local` committed. |
| **Deploy** | Push → production deploy → run `PRODUCTION_VERIFICATION_CHECKLIST.md`. |
