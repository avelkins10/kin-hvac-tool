# Supabase Migration Progress

## ✅ Completed

### Code Updates - Storage Integration
- ✅ Created `lib/templates/proposal-generator.ts` - Server-side proposal PDF generator
- ✅ Updated `app/api/proposals/[id]/send/route.ts` - Generates and uploads proposal PDFs to Supabase Storage
- ✅ Updated `app/api/signatures/send/route.ts` - Uploads agreement PDFs to Supabase before sending to SignNow
- ✅ Updated `app/api/webhooks/signnow/route.ts` - Downloads and stores signed documents in Supabase Storage
- ✅ Updated `src/components/InteractiveHouseAssessment.tsx` - Nameplate photos upload to Supabase Storage
- ✅ Created `app/api/nameplate/upload/route.ts` - API route for nameplate uploads

### Code Updates - Authentication
- ✅ Fixed reverted API routes back to Supabase Auth:
  - `app/api/company/labor-rates/[id]/route.ts`
  - `app/api/company/permits/[id]/route.ts`
  - `app/api/company/maintenance-plans/route.ts`
  - `app/api/company/incentives/route.ts`
  - `app/api/company/pricebook/route.ts`
  - `app/api/proposals/route.ts`
  - `app/api/clients/[id]/route.ts`
  - `app/api/finance/lightreach/payment-schedule/[applicationId]/route.ts`
- ✅ Fixed `components/layout/AppLayout.tsx` - Removed NextAuth `signOut({ callbackUrl })` syntax

### Storage Functions Available
- ✅ `uploadNameplatePhoto()` - Uploads nameplate photos
- ✅ `uploadProposalPDF()` - Uploads proposal PDFs
- ✅ `uploadAgreementPDF()` - Uploads agreement PDFs
- ✅ `uploadSignedDocument()` - Uploads signed documents
- ✅ `getSignedUrl()` - Generates signed URLs for private access

## ⏳ Pending (Requires User Action)

### Database Migration
- ⏳ **BLOCKED**: Need correct Supabase connection string
  - Current error: "Tenant or user not found"
  - Action: Verify connection string from Supabase dashboard
  - See: `GET_SUPABASE_CONNECTION_STRING.md`
- ⏳ Run Prisma migrations on Supabase (after connection verified)
- ⏳ Execute data migration script (`scripts/migrate-to-supabase.ts`)
- ⏳ Verify all tables and data migrated correctly

### Storage Setup
- ⏳ Run `scripts/setup-supabase-storage.sql` in Supabase SQL Editor
  - Creates 4 buckets: nameplates, proposals, signed-docs, agreements
  - Creates RLS policies (will work after Supabase Auth is fully migrated)

### Environment Variables
- ⏳ Add to Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ⏳ Update `DATABASE_URL` in Vercel to Supabase (after migration)

### Schema Cleanup
- ⏳ Remove NextAuth models from schema (Account, Session, VerificationToken)
  - Currently still in schema but can be removed after Supabase Auth is fully working
  - User model already has `supabaseUserId` field

## 📝 Notes

### Build Error
- AdminSettings.tsx has a parsing error in build logs
- File structure looks correct - may be a transient build cache issue
- Can be resolved by clearing build cache or checking for hidden characters

### NextAuth API Route
- `app/api/auth/[...nextauth]/route.ts` still exists but is unused
- Can be safely deleted after confirming Supabase Auth works

### Storage RLS Policies
- Policies reference `supabaseUserId` in User table
- Will work automatically after Supabase Auth migration is complete
- Currently using `service_role` key (bypasses RLS) for compatibility
