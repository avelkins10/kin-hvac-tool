# Creating Your First Admin User (Supabase Auth)

If you get 401 Unauthorized when logging in, no Supabase Auth user exists yet or the password is wrong.

## Option 1: Using the Script (Recommended)

Ensure `.env.local` has `DATABASE_URL` pointing to **Supabase** (same as your pooler URL), `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`), and `SUPABASE_SERVICE_ROLE_KEY`. The script loads `.env.local` automatically. Then run:

```bash
npm run create-admin <email> <password> <company-name>
```

Example:
```bash
npm run create-admin austin@kinhome.com MyPassword123! "Kin Home"
```

Defaults if you omit arguments:
- Email: `admin@example.com`
- Password: `Admin123!`
- Company: `Default Company`

The script creates (or links) a Supabase Auth user and a `User` row in your database with `supabaseUserId` and `COMPANY_ADMIN` role.

## Option 2: Supabase Dashboard + Prisma

1. In Supabase: **Authentication → Users → Add user** (email + password).
2. Copy the new user’s UUID.
3. In Prisma Studio (with `DATABASE_URL` pointing to Supabase), create or update a `User` with that email, `supabaseUserId` = the UUID, `role` = `COMPANY_ADMIN`, and a valid `companyId`.

## Option 3: Existing DB user, no Auth user

If you migrated from Neon and have `User` rows with `supabaseUserId` = NULL:

1. Run the create-admin script with the same email as the existing user and the desired password. It will create the Supabase Auth user and link it.
2. Or create the user in Supabase Auth (step 1 of Option 2), then set that user’s `supabaseUserId` on the existing `User` row in the database.

## Troubleshooting

- **401**: No Supabase Auth user for that email, or wrong password.
- **Database connection**: Check `DATABASE_URL` (Supabase connection string).
- **Script fails**: Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (service role required for `createUser` / `updateUserById`).

## Production (Vercel)

1. Use production `DATABASE_URL` (Supabase) and Supabase env vars.
2. Run the create-admin script locally with those env vars, or from a one-off script/CLI that has access to them.
