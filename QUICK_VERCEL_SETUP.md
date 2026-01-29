# Quick Vercel Environment Variables Setup

## Option 1: Using Vercel CLI (Fastest)

If you have Vercel CLI installed and linked to your project:

```bash
./scripts/add-vercel-env-vars.sh
```

Or manually run these commands:

```bash
# Required variables
vercel env add PALMETTO_FINANCE_ACCOUNT_EMAIL production
# Enter: scott@kinhome.com
# Repeat for preview and development

vercel env add PALMETTO_FINANCE_ACCOUNT_PASSWORD production
# Enter: Lionhive1!
# Repeat for preview and development

vercel env add PALMETTO_FINANCE_ENVIRONMENT production
# Enter: next
# Repeat for preview and development

# Recommended variables
vercel env add PALMETTO_SALES_REP_NAME production
# Enter: Austin Elkins
# Repeat for preview and development

vercel env add PALMETTO_SALES_REP_EMAIL production
# Enter: austin@kinhome.com
# Repeat for preview and development

vercel env add PALMETTO_SALES_REP_PHONE production
# Enter: 801-928-6369
# Repeat for preview and development
```

## Option 2: Manual Setup via Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project: **kin-hvac-tool**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New** for each variable below
5. **Important:** Select all three environments (Production, Preview, Development) for each variable

### Variables to Add:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `PALMETTO_FINANCE_ACCOUNT_EMAIL` | `scott@kinhome.com` | All 3 |
| `PALMETTO_FINANCE_ACCOUNT_PASSWORD` | `Lionhive1!` | All 3 |
| `PALMETTO_FINANCE_ENVIRONMENT` | `next` | All 3 |
| `PALMETTO_SALES_REP_NAME` | `Austin Elkins` | All 3 |
| `PALMETTO_SALES_REP_EMAIL` | `austin@kinhome.com` | All 3 |
| `PALMETTO_SALES_REP_PHONE` | `801-928-6369` | All 3 |

## After Adding Variables

Vercel will automatically trigger a redeploy. Wait for it to complete, then test the finance application flow.

## Environment Note

- `PALMETTO_FINANCE_ENVIRONMENT=next` = Staging/test environment (recommended for initial testing)
- Change to `prod` when ready for production
