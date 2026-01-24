# Vercel Environment Variables Setup Guide

## Quick Setup Steps

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project (kin-hvac-tool)
3. Go to **Settings** → **Environment Variables**
4. Add each variable below (make sure to select **Production**, **Preview**, and **Development** for each)

## Required Environment Variables

### Database
```
DATABASE_URL=your-neon-postgresql-connection-string
```
- Get this from your Neon dashboard: https://console.neon.tech
- Format: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`

### NextAuth (Authentication)
```
NEXTAUTH_SECRET=GENERATED_SECRET_BELOW
NEXTAUTH_URL=https://your-app-name.vercel.app
```
- **NEXTAUTH_SECRET**: Use the generated secret below
- **NEXTAUTH_URL**: Your Vercel deployment URL (will be shown after first deploy)

## Optional Environment Variables

### SignNow (E-Signature)
```
SIGNNOW_API_HOST=https://api.signnow.com
SIGNNOW_BASIC_TOKEN=your-signnow-basic-token
SIGNNOW_USERNAME=your-signnow-username
SIGNNOW_PASSWORD=your-signnow-password
SIGNNOW_FROM_EMAIL=your-email@example.com
```

### Email (SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

### OpenAI (Nameplate Analysis)
```
OPENAI_API_KEY=sk-your-openai-api-key
```

### LightReach (Finance Integration)
```
LIGHTREACH_API_KEY=your-lightreach-api-key
LIGHTREACH_BASE_URL=https://api.lightreach.com/v1
```

## Generated NEXTAUTH_SECRET

Use this value for `NEXTAUTH_SECRET`:

```
YTlRW8PLwFVqMD/XZw5NAZDs6vdkQlZHA0EHa+IGDas=
```

**Copy this value exactly as shown above.**

## After Setting Variables

1. **Redeploy** your project (Vercel will automatically redeploy when you add variables, or you can trigger a manual redeploy)
2. Wait for the build to complete
3. Visit your deployment URL
4. Test the application

## Notes

- Make sure to select all three environments (Production, Preview, Development) when adding variables
- Never commit `.env` files to git (already in .gitignore)
- The `NEXTAUTH_URL` should match your actual Vercel deployment URL
- You can find your deployment URL in the Vercel project dashboard under "Domains"
