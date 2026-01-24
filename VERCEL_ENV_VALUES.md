# Vercel Environment Variables - Ready to Copy

## Copy these values directly into Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add each variable below. Make sure to select **Production**, **Preview**, and **Development** for each.

---

## Required Variables

### 1. DATABASE_URL
```
postgresql://neondb_owner:npg_W3HUwEXPZ0eC@ep-late-rice-aervqfab-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full
```

### 2. NEXTAUTH_SECRET
```
YTlRW8PLwFVqMD/XZw5NAZDs6vdkQlZHA0EHa+IGDas=
```

### 3. NEXTAUTH_URL
```
https://your-app-name.vercel.app
```
**Note:** Replace `your-app-name` with your actual Vercel deployment URL. You'll see this after the first deployment, or check your Vercel project dashboard.

---

## Optional Variables (Add as needed)

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

### OpenAI
```
OPENAI_API_KEY=sk-your-openai-api-key
```

### Palmetto Finance (LightReach)
```
# New authentication method (recommended)
PALMETTO_FINANCE_ACCOUNT_EMAIL=your-service-account@domain.com
PALMETTO_FINANCE_ACCOUNT_PASSWORD=your-service-account-password
PALMETTO_FINANCE_ENVIRONMENT=next  # or 'prod' for production
PALMETTO_FINANCE_BASE_URL=https://next.palmetto.finance  # optional, auto-set based on environment
PALMETTO_FINANCE_AUTH_URL=https://next.palmetto.finance/api/auth/login  # optional, auto-set based on environment

# Optional - Sales Rep Defaults (used if not provided per application)
PALMETTO_SALES_REP_NAME=Austin Elkins
PALMETTO_SALES_REP_EMAIL=austin@kinhome.com
PALMETTO_SALES_REP_PHONE=801-928-6369

# Optional - Webhook Authentication (from webhook registration)
# Use ONE of these methods:
# Method 1: API Key (default)
LIGHTREACH_WEBHOOK_API_KEY=your-webhook-api-key-from-registration
# Method 2: Client Headers
# LIGHTREACH_WEBHOOK_CLIENT_ID=your-client-id
# LIGHTREACH_WEBHOOK_CLIENT_SECRET=your-client-secret

# Legacy support (deprecated)
LIGHTREACH_API_KEY=deprecated-use-palmetto-credentials-above
LIGHTREACH_BASE_URL=https://api.lightreach.com/v1
```

---

## Quick Setup Steps

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: kin-hvac-tool
3. **Navigate to**: Settings → Environment Variables
4. **Add the 3 required variables above**
5. **Important**: Check all three boxes (Production, Preview, Development) for each variable
6. **Save** - Vercel will automatically redeploy

---

## After Adding Variables

1. Wait for automatic redeploy (or trigger manual redeploy)
2. Check deployment logs to ensure build succeeds
3. Visit your deployment URL
4. Test the application

---

## Your Neon Database Info

- **Project**: hvac-proposal-builder
- **Project ID**: hidden-voice-03266260
- **Database**: neondb
- **Region**: us-east-2 (Ohio)
- **Connection String**: Already configured above ✅
