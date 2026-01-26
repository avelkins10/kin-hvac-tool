# LightReach Credentials Setup Instructions

## Credentials Received ✅

- **Service Account Email:** `scott@kinhome.com`
- **Service Account Password:** `Lionhive1!`
- **Environment:** Need to confirm - `next` (staging) or `prod` (production)?

## Steps to Add to Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project (kin-hvac-tool)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables (select **Production**, **Preview**, and **Development** for each):

### Required Variables

```
PALMETTO_FINANCE_ACCOUNT_EMAIL=scott@kinhome.com
PALMETTO_FINANCE_ACCOUNT_PASSWORD=Lionhive1!
PALMETTO_FINANCE_ENVIRONMENT=next
```

**Important:** 
- Replace `next` with `prod` if you want to use production environment
- The password is sensitive - make sure it's added correctly

### Recommended Variables

```
PALMETTO_SALES_REP_NAME=Austin Elkins
PALMETTO_SALES_REP_EMAIL=austin@kinhome.com
PALMETTO_SALES_REP_PHONE=801-928-6369
```

## After Adding Variables

1. **Redeploy** your project (Vercel will automatically redeploy when you add variables)
2. Wait for the build to complete
3. Test the finance application flow in your app

## Testing

Once the variables are set, you can test:
1. Create a proposal in the app
2. Go through the payment step
3. Select a LightReach financing option
4. Submit the finance application
5. Check if it successfully creates an account in Palmetto Finance

## Questions

**Which environment should we use?**
- `next` = Staging/test environment (recommended for initial testing)
- `prod` = Production environment (use after testing works)

Let me know which one you prefer and I can help test the integration!
