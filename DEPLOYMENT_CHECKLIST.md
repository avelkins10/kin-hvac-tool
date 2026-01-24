# Deployment Checklist for GitHub & Vercel

## ✅ Completed Pre-Deployment Fixes

1. **Updated .gitignore**
   - Added `local-packages/` to ignore local uv/uvx installation
   - Added `.DS_Store` for macOS

2. **Updated Environment Variables**
   - Updated `.env.example` with SignNow credentials (replaced PandaDoc)
   - All required variables documented

3. **Verified Configuration**
   - No hardcoded paths in codebase
   - Vercel configuration (`vercel.json`) is correct
   - Package.json includes SignNow SDK (`@signnow/api-client`)

4. **Code Updates**
   - SignNow integration implemented
   - All API routes updated to use SignNow
   - Webhook handler created for SignNow

## 📋 Pre-Deployment Steps

### 1. Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: HVAC Proposal Builder with SignNow integration"
```

### 2. Create GitHub Repository

1. Go to GitHub and create a new repository
2. Don't initialize with README (you already have one)
3. Copy the repository URL

### 3. Push to GitHub

```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### 4. Deploy to Vercel

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

### 5. Configure Environment Variables in Vercel

In Vercel Dashboard → Project Settings → Environment Variables, add:

**Required:**
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

**Optional (for full functionality):**
- `OPENAI_API_KEY` - For nameplate analysis
- `LIGHTREACH_API_KEY` - For finance integration
- `SIGNNOW_API_HOST` - SignNow API host (default: `https://api.signnow.com`)
- `SIGNNOW_BASIC_TOKEN` - SignNow basic authentication token
- `SIGNNOW_USERNAME` - SignNow account username
- `SIGNNOW_PASSWORD` - SignNow account password
- `SIGNNOW_FROM_EMAIL` - Email address to send signature requests from
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` - For email

### 6. Database Setup

Vercel will automatically run migrations during build (configured in `package.json` build script):
- `prisma generate` - Generates Prisma Client
- `prisma migrate deploy` - Runs database migrations

### 7. Post-Deployment

1. Test login with your admin credentials
2. Create additional users as needed
3. Test proposal creation flow
4. Verify SignNow integration works
5. Test webhook endpoint (configure in SignNow dashboard)

## 🔧 SignNow Webhook Configuration

After deployment, configure SignNow webhooks:

1. Go to your SignNow account settings
2. Navigate to Webhooks section
3. Add webhook URL: `https://your-app.vercel.app/api/webhooks/signnow`
4. Subscribe to events:
   - `document.complete`
   - `document.decline`
   - `document.field_invite.complete`

## 📝 Notes

- The build script includes `prisma migrate deploy` to ensure migrations run on each deployment
- Neon connection pooling is automatically handled
- Make sure `NEXTAUTH_URL` matches your Vercel deployment URL
- The old PandaDoc integration file (`lib/integrations/pandadoc.ts`) is still in the codebase but not used - you can delete it if desired

## 🚀 Quick Deploy Commands

```bash
# Initialize and push to GitHub
git init
git add .
git commit -m "Ready for deployment"
git remote add origin <your-repo-url>
git push -u origin main

# Deploy to Vercel (if using CLI)
vercel --prod
```

## ⚠️ Important

- Never commit `.env.local` or any `.env*` files (already in .gitignore)
- The `local-packages/` directory is for local development only and is ignored
- All environment variables must be set in Vercel dashboard for production
