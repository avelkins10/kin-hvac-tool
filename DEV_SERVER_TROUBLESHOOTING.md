# Dev Server Troubleshooting

## ENOENT / 500 errors (missing `.next` manifest files)

If you see errors like:

- `ENOENT: no such file or directory, open '.../.next/dev/prerender-manifest.json'`
- `ENOENT: no such file or directory, open '.../.next/dev/routes-manifest.json'`
- `Cannot find module '.../.next/dev/server/middleware-manifest.json'`
- `GET /` or `GET /auth/signin` returning **500**

**Fix applied in this repo:** Next.js 16 expects the **proxy** convention instead of **middleware**. The project uses `proxy.ts` (not `middleware.ts`). If you still have `middleware.ts`, rename it to `proxy.ts` and export `proxy()` instead of `middleware()`.

They can also come from **Turbopack** (Next.js 16’s default dev bundler) having race conditions when:

1. **More than one dev server is running** (e.g. port 3000 in use, so a second server starts on 3001 and both touch `.next`).
2. **Requests hit the app while Turbopack is still writing** manifest files.

### What to do

1. **Use a single dev server**
   - Stop any other `next dev` / `pnpm dev` / `npm run dev` (Ctrl+C in those terminals).
   - If something is still bound to port 3000, find and kill it:
     ```bash
     lsof -i :3000
     kill <PID>
     ```
   - From the project root, clear the cache and start once:
     ```bash
     rm -rf .next && pnpm dev
     ```
   - Use only that one process; avoid starting another dev server in a second terminal.

2. **If ENOENT/500 still happen: use webpack instead of Turbopack**
   - Stop the dev server (Ctrl+C).
   - Clear cache and run with webpack:
     ```bash
     rm -rf .next && pnpm run dev:webpack
     ```
   - This runs `next dev --webpack`, which avoids Turbopack’s manifest races. The first compile may be slower; after that the app should stay stable.

3. **If you switch back to Turbopack later**
   - Again, run only one dev server and use `rm -rf .next && pnpm dev` after pulling changes or if things look broken.

## Auth / API 500s (Prisma, DB)

If **GET /api/auth/user** or other API routes return 500 with Prisma/DB errors, see:

- **Unknown field `lightreachSalesRepName`** → run `npx prisma generate` and restart the dev server.
- **Column does not exist (P2022)** → apply the User table migration (see `MIGRATE_LIGHTREACH_USER.md`), then restart.

## Production build

Production uses **webpack** (Next.js production build), not Turbopack. The dev ENOENT issues do not affect production.

- **Local production build:** `pnpm run build` (runs `prisma generate`, then `prisma migrate deploy`, then `next build`). If `prisma migrate deploy` times out locally, that’s expected; on Vercel it runs in the build and usually succeeds.
- **Vercel:** `vercel.json` is set to `pnpm run build` so Prisma and migrations run before `next build`. Ensure `DATABASE_URL` (Supabase pooler URL) is set in Vercel.
- **Single dev server:** To avoid ENOENT in dev, run only one dev server and kill any process using port 3000 before starting (`lsof -i :3000` then `kill <PID>`).

## Quick fix from terminal (one command)

**Always use a single dev server.** If port 3000 is in use, Next may start on 3002 and both processes will corrupt `.next` (ENOENT on `/users`, `/proposals`, etc.).

From the project root, run:

```bash
pnpm run dev:clean
```

This kills anything on ports 3000 and 3002, removes `.next`, and starts dev with webpack on port 3000. Then open http://localhost:3000.

Manual steps if you prefer:

```bash
(lsof -ti:3000; lsof -ti:3002) 2>/dev/null | xargs kill -9 2>/dev/null
rm -rf .next
pnpm run dev
```

**Note:** `pnpm dev` now uses webpack by default (not Turbopack) to avoid manifest/ENOENT issues. Use `dev:clean` whenever you see ENOENT or 500s on navigation.
