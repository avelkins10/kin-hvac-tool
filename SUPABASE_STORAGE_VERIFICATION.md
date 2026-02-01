# Supabase Storage Setup — Verification Checklist

Run the storage setup by executing `scripts/setup-supabase-storage.sql` in the [Supabase SQL Editor](https://supabase.com/dashboard) (Project → SQL Editor → New Query). Then use this checklist to verify the setup.

## Verification Checklist

- [ ] 4 buckets visible in Storage dashboard
- [ ] All buckets show correct size limits (5MB for nameplates, 10MB for others)
- [ ] All buckets show correct MIME types
- [ ] 12 RLS policies created in `storage.objects` table (INSERT, SELECT, DELETE for each of the 4 buckets)
- [ ] Helper function `check_company_access()` exists
- [ ] Buckets are private (`public = false`)

## Quick Verification Queries

Run these in the Supabase SQL Editor after executing the setup script.

**Buckets:**
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('nameplates', 'proposals', 'signed-docs', 'agreements');
```

**RLS policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
```

**Helper function:**
```sql
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'check_company_access';
```

## Notes

- RLS policies are **not** enforced while the app uses `SUPABASE_SERVICE_ROLE_KEY` in `lib/storage/supabase-storage.ts`; the service role bypasses RLS. Policies will apply after the Auth migration when using authenticated clients.
- Storage paths use the pattern `companyId/filename`; RLS validates the first path segment against the user's `companyId` via the User table (`supabaseUserId`).
