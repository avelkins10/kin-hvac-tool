# Supabase env vars for kin-hvac-tool (verified via Supabase MCP)

Use this to confirm **Vercel** and **local** `.env.local` have the right Supabase variables for this project.

## Project (Supabase MCP)

- **Project:** kin-hvac-tool  
- **Project ID / ref:** `cvhomuxlhinmviwfkkyh`  
- **Region:** us-east-2  
- **Status:** ACTIVE_HEALTHY  

## Required variables

| Variable | Where to get / value | Used by |
|----------|------------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://cvhomuxlhinmviwfkkyh.supabase.co` | Auth (login, callback, middleware), client, server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key **or** legacy anon key (see below) | Auth, client, server, middleware |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` (secret) | Storage, create-admin script; **server-only** |
| `DATABASE_URL` | **Use Shared Pooler (Supavisor)** — see below | Prisma, app DB |
| `SUPABASE_DATABASE_URL` | Same as `DATABASE_URL` for Supabase (optional alias) | Scripts, migration |

### DATABASE_URL: Use Shared Pooler (IPv4 + TLS)

Direct connection and Dedicated Pooler in the Supabase Connect modal are **not IPv4 compatible**. Vercel and many local networks are IPv4-only, which can cause connection failures or TLS errors (“self-signed certificate in certificate chain”).

**Do this:**

1. In **Supabase Dashboard** → **Connect** → **Connection String** tab.
2. Set **Source:** Primary Database, **Method:** Session pooler (or Transaction pooler if you prefer).
3. Use the **“Using the Shared Pooler”** URI (the one labeled **IPV4 COMPATIBLE**), not the Dedicated Pooler.

**Format for this project (Shared Pooler, IPv4 compatible):**

- **Transaction mode (port 6543):**  
  `postgresql://postgres.cvhomuxlhinmviwfkkyh:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres`  
  Transaction mode does not support PREPARE; the app adds `uselibpqcompat=true` on Vercel.

Set that URI as `DATABASE_URL` in `.env.local` and in Vercel → Project → Settings → Environment Variables. Redeploy after changing.

## Optional / compatibility

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Fallback for `NEXT_PUBLIC_SUPABASE_URL` in server code |
| `SUPABASE_ANON_KEY` | Fallback for `NEXT_PUBLIC_SUPABASE_ANON_KEY` in server code (e.g. if only server env is set) |

## Keys (Supabase MCP – project `cvhomuxlhinmviwfkkyh`)

- **Project URL:** `https://cvhomuxlhinmviwfkkyh.supabase.co`
- **Publishable key** (recommended): use the key named **default** in Dashboard → Project Settings → API (format `sb_publishable_...`).  
  The app’s `.env.local` uses this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Legacy anon key:** also valid; use if you prefer JWT-style anon key.

Both publishable and legacy anon keys work for Auth (login, callback, middleware). Ensure **one** of them is set as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_ANON_KEY` on the server).

## Vercel checklist

1. **Project Settings → Environment Variables** (Production, Preview, Development as needed):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://cvhomuxlhinmviwfkkyh.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your publishable or legacy anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role secret (do not expose to client)
   - `DATABASE_URL` = Supabase Postgres connection string (pooler)
2. Redeploy after changing env vars so they apply to the build/runtime.

## Auth: Site URL & Redirect URLs (Supabase Dashboard)

**Important for login/session cookies:** Supabase uses the **Site URL** for redirects and session behavior. If login works locally but not in production (or cookies don’t stick after sign-in), set this in the Supabase project:

1. **Supabase Dashboard** → your project → **Authentication** → **URL Configuration**
2. **Site URL:** set to your production app URL, e.g. `https://kin-hvac-tool.vercel.app` (not `http://localhost:3000` for prod).
3. **Redirect URLs:** add:
   - `https://kin-hvac-tool.vercel.app/**`
   - `https://kin-hvac-tool.vercel.app/auth/callback`
   - `http://localhost:3000/**` (for local dev)

If Site URL is wrong or missing for production, session cookies may not be set or accepted correctly after sign-in.
