# Vercel Deployment Guide

## Pre-Deployment Checklist

1. ✅ Database is set up (Neon PostgreSQL)
2. ✅ Prisma schema migrated
3. ✅ Admin user created
4. ⏳ Environment variables configured
5. ⏳ Deploy to Vercel

## Deployment Steps

### 1. Push to GitHub (if not already)

```bash
git add .
git commit -m "Add database integration and full-stack setup"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel
```

### 3. Configure Environment Variables in Vercel

In Vercel Dashboard → Project Settings → Environment Variables, add:

**Required:**
- `DATABASE_URL` - Your Neon connection string
- `NEXTAUTH_SECRET` - Use the same one from `.env.local` or generate new: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

**Optional (for full functionality):**
- `OPENAI_API_KEY` - For nameplate analysis
- `LIGHTREACH_API_KEY` - For finance integration
- `SIGNNOW_API_HOST` - SignNow API host (default: https://api.signnow.com)
- `SIGNNOW_BASIC_TOKEN` - SignNow basic authentication token
- `SIGNNOW_USERNAME` - SignNow account username
- `SIGNNOW_PASSWORD` - SignNow account password
- `SIGNNOW_FROM_EMAIL` - Email address to send signature requests from (optional, defaults to username)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` - For email

### 4. Database Migrations

Vercel will automatically run `prisma migrate deploy` during build (configured in `package.json` build script).

### 5. Create Additional Users

After deployment, you can create users via:
- API: `POST /api/users` (requires admin login)
- Or directly in database via Neon console

## Post-Deployment

1. Test login with `austin@kinhome.com` / `admin123`
2. Create additional users as needed
3. Test proposal creation flow
4. Verify all API endpoints work

## Notes

- The build script includes `prisma migrate deploy` to ensure migrations run on each deployment
- Neon connection pooling is automatically handled
- Make sure `NEXTAUTH_URL` matches your Vercel deployment URL
