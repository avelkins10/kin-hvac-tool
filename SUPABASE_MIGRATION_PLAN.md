# Supabase Migration Plan

## Overview

Migrating from Neon PostgreSQL to Supabase to gain:
- ✅ File storage for photos, PDFs, and documents
- ✅ Better authentication for credit checks
- ✅ Row-level security for financial data
- ✅ Real-time updates for proposal status
- ✅ Better user management

## Current State

- **Database**: Neon PostgreSQL (working, data seeded)
- **Storage**: None (base64 in JSON, PDFs generated on-the-fly)
- **Auth**: NextAuth.js with credentials
- **Files**: Nameplate photos (base64), PDFs (not stored), signed docs (not stored)

## Migration Steps

### Phase 1: Supabase Project Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Choose region (same as Neon if possible)
   - Note: Project URL and API keys

2. **Get Connection Details**
   - Database connection string (PostgreSQL)
   - Supabase URL
   - Supabase Anon Key
   - Supabase Service Role Key

### Phase 2: Database Migration

1. **Export Data from Neon**
   - Export schema (Prisma migrations)
   - Export data (pg_dump or Neon export)

2. **Import to Supabase**
   - Run Prisma migrations on Supabase
   - Import data
   - Verify all tables and data

3. **Update Connection String**
   - Update `DATABASE_URL` in Vercel
   - Test connection

### Phase 3: Storage Setup

1. **Create Storage Buckets**
   - `nameplates` - For HVAC nameplate photos
   - `proposals` - For generated proposal PDFs
   - `signed-docs` - For signed documents from SignNow
   - `agreements` - For agreement PDFs

2. **Set Up Storage Policies**
   - Public read for proposals (with token)
   - Authenticated write for uploads
   - Company-based access control

3. **Update Code**
   - Replace base64 storage with Supabase Storage
   - Update PDF generation to save to Storage
   - Update document retrieval to use Storage URLs

### Phase 4: Authentication (Optional)

**Option A: Keep NextAuth** (Recommended initially)
- Keep current NextAuth setup
- Use Supabase for storage only
- Less migration risk

**Option B: Migrate to Supabase Auth**
- Replace NextAuth with Supabase Auth
- Better audit trails
- Better session management
- More work upfront

### Phase 5: Row-Level Security (RLS)

1. **Enable RLS on Tables**
   - `Proposal` - Company isolation
   - `FinanceApplication` - Credit data protection
   - `User` - Multi-tenant isolation

2. **Create RLS Policies**
   - Users can only see their company's data
   - Admins can see all company data
   - Super admins can see everything

### Phase 6: Real-Time (Optional)

1. **Enable Realtime**
   - Proposal status changes
   - Finance application updates
   - Signature status changes

2. **Update Frontend**
   - Subscribe to proposal changes
   - Live status updates

## Code Changes Required

### 1. Storage Integration

**New File**: `lib/storage/supabase-storage.ts`
```typescript
// Upload nameplate photo
// Upload proposal PDF
// Upload signed document
// Get public URL
// Delete file
```

**Files to Update**:
- `app/api/analyze-nameplate/route.ts` - Save photo to Storage
- `lib/templates/agreement-generator.ts` - Save PDF to Storage
- `app/api/signatures/send/route.ts` - Save signed doc to Storage
- `src/components/InteractiveHouseAssessment.tsx` - Upload photos to Storage

### 2. Database Connection

**File**: `lib/db.ts`
- Update Prisma client connection string
- No other changes needed (Prisma works with Supabase)

### 3. Environment Variables

**Add to Vercel**:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Update**:
```
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

## Migration Checklist

### Pre-Migration
- [ ] Create Supabase project
- [ ] Export Neon database
- [ ] Backup all data
- [ ] Document current state

### Database Migration
- [ ] Run Prisma migrations on Supabase
- [ ] Import data from Neon
- [ ] Verify all tables exist
- [ ] Verify data integrity
- [ ] Test queries

### Storage Setup
- [ ] Create storage buckets
- [ ] Set up storage policies
- [ ] Test file uploads
- [ ] Test file retrieval
- [ ] Test file deletion

### Code Updates
- [ ] Install Supabase client library
- [ ] Create storage utility functions
- [ ] Update nameplate photo upload
- [ ] Update PDF generation to save
- [ ] Update signed document storage
- [ ] Update file retrieval logic

### Testing
- [ ] Test proposal creation
- [ ] Test nameplate photo upload
- [ ] Test PDF generation and storage
- [ ] Test signed document storage
- [ ] Test file access permissions
- [ ] Test multi-tenant isolation

### Deployment
- [ ] Update Vercel environment variables
- [ ] Deploy to staging
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor for issues

## Risk Mitigation

1. **Keep Neon as Backup**
   - Don't delete Neon project immediately
   - Keep it for 30 days as backup

2. **Gradual Migration**
   - Migrate database first
   - Add storage incrementally
   - Test each phase

3. **Rollback Plan**
   - Keep Neon connection string
   - Can switch back if needed
   - Document rollback steps

## Timeline Estimate

- **Phase 1-2 (Database)**: 2-4 hours
- **Phase 3 (Storage)**: 4-6 hours
- **Phase 4 (Auth - if doing)**: 4-8 hours
- **Phase 5 (RLS)**: 2-4 hours
- **Phase 6 (Real-time)**: 2-4 hours
- **Testing**: 2-4 hours

**Total**: 16-30 hours (depending on auth migration)

## Next Steps

1. Create Supabase project
2. Get connection details
3. Start with database migration
4. Then add storage
5. Then add RLS
6. Then add real-time (optional)
