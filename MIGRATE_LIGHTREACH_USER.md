# Apply User LightReach Sales Rep Migration

The Prisma migration that adds `lightreachSalesRepName`, `lightreachSalesRepEmail`, and `lightreachSalesRepPhone` to the `User` table may not have been applied (e.g. `npx prisma migrate deploy` timed out).

## Option 1: Run migration via Prisma (if it connects)

```bash
npx prisma migrate deploy
```

If this completes successfully, you're done. Restart the dev server if needed.

## Option 2: Apply SQL in Supabase, then mark migration as applied

1. **Supabase Dashboard** → your project → **SQL Editor**.

2. **Run this SQL**:

```sql
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "lightreachSalesRepName" TEXT,
  ADD COLUMN IF NOT EXISTS "lightreachSalesRepEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "lightreachSalesRepPhone" TEXT;
```

3. **Tell Prisma the migration was applied** (so it won’t try to run it again):

```bash
npx prisma migrate resolve --applied 20260202000000_user_lightreach_sales_rep
```

4. Restart the Next.js dev server (`pnpm dev` or `npm run dev`).

After this, `GET /api/auth/user` and the profile page will work with the new LightReach sales rep fields.
