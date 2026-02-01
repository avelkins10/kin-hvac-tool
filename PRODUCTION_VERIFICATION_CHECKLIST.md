# Production Verification Checklist - Post-Vercel Deployment

## Overview

Systematic steps to verify kin-hvac-tool is fully functional in production after deploying to Vercel. Follow in order.

---

## Prerequisites

Before starting:

- [ ] App deployed to Vercel
- [ ] Vercel environment variables configured (see `scripts/sync-vercel-supabase-env.sh`)
- [ ] Supabase project set up with storage buckets
- [ ] Database migrated to Supabase
- [ ] Admin user created in Supabase Auth

**Vercel URL:** `https://your-app.vercel.app` (replace with your production URL)

---

## Step 1: Access & Authentication (~5 min)

### 1.1 Access the Application

1. Open your Vercel deployment URL in a browser.
2. You should see the login page.

**Expected:**

- Login page loads without errors
- No console errors in DevTools
- Styling looks correct

**If it fails:** Check Vercel deployment logs; verify `NEXT_PUBLIC_SUPABASE_URL` in Vercel; check browser console.

### 1.2 Test Login

1. Sign in with admin credentials (e.g. email used when creating admin, your password).
2. Click "Sign In".

**Expected:**

- Redirects to `/dashboard`
- Dashboard loads with stats and navigation
- User menu shows email in top-right

**If it fails:** Check Vercel logs; verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`; confirm user exists in Supabase Auth.

### 1.3 Test Session Persistence

1. Refresh the page (F5 or Cmd+R).
2. Navigate to Proposals, Clients, Users.

**Expected:**

- Stays logged in after refresh
- Can move between pages without re-login
- User menu still shows email

**If it fails:** Check cookies (e.g. `sb-*-access-token`); verify `middleware.ts`; check Supabase session settings.

---

## Step 2: Database Operations (~10 min)

### 2.1 View Dashboard Stats

1. Go to `/dashboard`.
2. Check the stats cards.

**Expected:**

- Total and active proposal counts
- Total clients count
- Recent proposals list

**If it fails:** Check Vercel logs; verify `DATABASE_URL` points to Supabase; run `scripts/test-supabase-connection.ts` (uses `SUPABASE_DATABASE_URL` or `DATABASE_URL` locally).

### 2.2 Test Company Settings (Admin Only)

1. Go to `/admin/settings`.
2. View Price Book, HVAC Systems, Add-ons, etc.

**Expected:**

- All admin tabs load
- Data displays correctly

**If it fails:** Check `GET /api/company/pricebook` and related routes; verify user has `ADMIN` (or `SUPER_ADMIN`) role; check Vercel function logs.

### 2.3 Create a Test Client

1. Go to `/clients`.
2. Add a client (e.g. Name, Email, Phone, Address).
3. Save.

**Expected:**

- Client appears in list
- Can view client details
- Data persists after refresh

**If it fails:** Check `POST /api/clients`; Vercel function logs; database connection.

### 2.4 View Users List

1. Go to `/users`.
2. View the users table.

**Expected:**

- At least admin user visible
- Email, role, company shown
- Can view user details

**If it fails:** Check `GET /api/users`; verify `User` table in Supabase.

---

## Step 3: File Storage (~10 min)

### 3.1 Test Nameplate Upload

1. Go to `/builder`.
2. Find the nameplate upload section.
3. Upload a test image (JPEG/PNG).

**Expected:**

- Upload progress and success
- Image displays in UI
- Image URL from Supabase Storage (e.g. `https://<project-ref>.supabase.co/storage/v1/object/public/nameplates/...`)

**If it fails:** Supabase Storage → `nameplates` bucket; ensure bucket exists and is configured; check `POST /api/nameplate/upload`; verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel.

### 3.2 Verify Storage Buckets

1. Supabase Dashboard → Storage.
2. Confirm buckets:
   - `nameplates` (public read for display)
   - `proposals` (private)
   - `signed-docs` (private)
   - `agreements` (private)

**Expected:**

- All four buckets exist
- `nameplates` contains test upload
- RLS/policies as intended

**If missing:** Run `scripts/setup-supabase-storage.sql` in Supabase SQL Editor; review bucket permissions.

---

## Step 4: Proposal Creation (~15 min)

### 4.1 Create a Test Proposal

1. Go to `/builder`.
2. Fill customer info and complete assessment steps.
3. Add equipment/systems and save.

**Expected:**

- Proposal saves
- Redirect to proposal view or list
- Proposal appears under `/proposals`
- Can open proposal details

**If it fails:** Check `POST /api/proposals`; Vercel logs; required fields.

### 4.2 Test Proposal Pipeline

1. Go to `/proposals/pipeline`.
2. View Kanban board.

**Expected:**

- Proposals in correct columns
- Drag between stages works (if implemented)
- Counts accurate

**If it fails:** Check `GET /api/proposals`; proposal status values vs. pipeline stages.

### 4.3 Test Proposal PDF (Optional)

1. Open a proposal.
2. Use "Send Proposal" or "Generate PDF".

**Expected:**

- PDF generates
- Uploads to Supabase `proposals` bucket
- Can download/view PDF

**If it fails:** Check `POST /api/proposals/[id]/send`; `proposals` bucket; Vercel logs.

---

## Step 5: Integrations (~10 min)

### 5.1 OpenAI Nameplate Analysis (if configured)

1. In `/builder`, upload nameplate image.
2. Run "Analyze" (or equivalent).

**Expected:**

- Analysis runs
- Equipment details (tonnage, SEER, etc.) populate form

**If it fails:** Verify `OPENAI_API_KEY` in Vercel; check `POST /api/analyze-nameplate`; Vercel logs. Skip if key not set.

### 5.2 LightReach Finance (if configured)

1. Open a proposal → financing section.
2. "Apply for Financing".

**Expected:**

- Finance form loads
- Can submit
- Status updates

**If it fails:** Verify LightReach env vars in Vercel; `POST /api/finance/lightreach/apply`; Vercel logs. Skip if not configured.

### 5.3 SignNow E-Signature (if configured)

1. Open proposal → "Send for Signature".
2. Fill signer details.

**Expected:**

- Agreement generated and sent to SignNow
- Signature request ID returned
- Agreement PDF in Supabase Storage

**If it fails:** Verify SignNow env vars; `POST /api/signatures/send`; Vercel logs. Skip if not configured.

---

## Step 6: API Routes Health Check (~5 min)

With DevTools → Network tab, ensure these return **200** when called (authenticated where required):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/user` | GET | Current user |
| `/api/dashboard/stats` | GET | Dashboard stats |
| `/api/proposals` | GET | List proposals |
| `/api/clients` | GET | List clients |
| `/api/users` | GET | List users |
| `/api/company/pricebook` | GET | Price book |
| `/api/company/settings` | GET | Company settings |
| `/api/health` | GET | App up + env present (no auth) |

**Expected:**

- All return 200 where applicable (`/api/health` returns 200 when required env vars are set; 503 if not)
- No 500s in Vercel logs
- Reasonable response times (< 2 s)

---

## Step 7: Error Handling & Edge Cases (~5 min)

### 7.1 Unauthorized Access

1. Incognito/private window.
2. Open `/dashboard` without logging in.

**Expected:** Redirect to `/auth/signin`; cannot access protected routes.

**If it fails:** Check `middleware.ts` and protected route list.

### 7.2 Invalid Login

1. Sign in with wrong email/password.

**Expected:** Error message; stay on login page; no redirect.

**If it fails:** Check `components/auth/LoginForm.tsx` error handling.

### 7.3 Logout

1. User menu (top-right) → Logout / Sign Out.

**Expected:** Redirect to `/auth/signin`; session cleared; `/dashboard` redirects to login.

**If it fails:** Check `components/layout/AppLayout.tsx`; ensure Supabase `signOut()` is called.

---

## Step 8: Performance & Monitoring (~5 min)

- **Vercel:** Project → Deployments → latest → Functions: no errors; reasonable execution times.
- **Analytics (if enabled):** Page loads &lt; 3 s; no JS errors; good Core Web Vitals.
- **Mobile:** Device mode or real device; layout, nav, and forms usable.

---

## Step 9: Supabase Configuration (~5 min)

### 9.1 Redirect URLs

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:**  
  - `https://your-app.vercel.app/auth/callback`  
  - `http://localhost:3000/auth/callback` (local)

### 9.2 Storage RLS

Authentication → Policies (or Storage policies):

- `nameplates`: public read (if used for public URLs)
- `proposals`, `signed-docs`, `agreements`: authenticated/appropriate access
- Policies aligned with `supabaseUserId` / company where applicable

If missing: run `scripts/setup-supabase-storage.sql` in Supabase SQL Editor.

---

## Verification Summary Checklist

### Core

- [ ] Login works
- [ ] Session persists across refreshes
- [ ] Dashboard loads with stats
- [ ] Can create clients
- [ ] Can view users list
- [ ] Can create proposals
- [ ] Proposal pipeline displays correctly
- [ ] Logout works

### File Storage

- [ ] Nameplate upload works
- [ ] Images display correctly
- [ ] All 4 storage buckets exist
- [ ] RLS/policies configured

### Database

- [ ] Critical API routes return 200
- [ ] Data persists after refresh
- [ ] CRUD works
- [ ] Company settings load

### Integrations (optional)

- [ ] OpenAI nameplate analysis (if configured)
- [ ] LightReach finance (if configured)
- [ ] SignNow e-signature (if configured)

### Security & Errors

- [ ] Unauthorized access redirects to login
- [ ] Invalid login shows error
- [ ] Protected routes secured
- [ ] Middleware behaves correctly

### Performance

- [ ] No errors in Vercel logs
- [ ] Page load times acceptable
- [ ] Mobile responsive

---

## Common Issues

| Issue | Likely cause | Action |
|-------|----------------|--------|
| "Failed to fetch" | API routes / env | Vercel logs; env vars; DB and Supabase credentials |
| Images not uploading | Storage/RLS | Run `scripts/setup-supabase-storage.sql`; set `SUPABASE_SERVICE_ROLE_KEY`; check bucket permissions |
| Login redirect loop | Session / middleware | Cookies; `NEXT_PUBLIC_SUPABASE_*` in Vercel; `middleware.ts`; Supabase redirect URLs |
| DB queries fail | Connection / URL | `DATABASE_URL` points to Supabase; correct pooler port; run `scripts/test-supabase-connection.ts`; URL-encode password if needed |
| OpenAI/LightReach/SignNow | Missing/invalid keys | Required env vars in Vercel; key validity; Vercel function logs |

---

## After Verification

1. Create real users via `/users`.
2. Configure company settings in `/admin/settings`.
3. Add integration credentials (OpenAI, SignNow, LightReach, SMTP) if not already set.
4. Optional: custom domain, monitoring (e.g. Sentry), backups, security review.

---

## Success Criteria

Production-ready when:

- Core functionality tests pass
- File storage works
- Database operations reliable
- Authentication secure
- No errors in Vercel logs
- Performance and mobile experience acceptable

---

## References

- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh
- **Project:** `DEPLOYMENT_CHECKLIST.md`, `SUPABASE_MIGRATION_STATUS.md`, `OPTIMIZATION_ROADMAP.md`
