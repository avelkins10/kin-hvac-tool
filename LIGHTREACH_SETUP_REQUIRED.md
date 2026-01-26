# LightReach API Setup - Required Information

To get the real LightReach API working, I need the following information from you:

## Required Credentials

### 1. Palmetto Finance Account Credentials
These are used to authenticate with the Palmetto Finance API (LightReach):

```bash
PALMETTO_FINANCE_ACCOUNT_EMAIL=your-service-account@domain.com
PALMETTO_FINANCE_ACCOUNT_PASSWORD=your-service-account-password
```

**Where to get these:**
- Contact Palmetto/LightReach support or your account manager
- These should be service account credentials (not personal user accounts)
- Used for OAuth2 authentication to get access tokens

### 2. Environment Configuration
```bash
PALMETTO_FINANCE_ENVIRONMENT=next  # or 'prod' for production
```

**Options:**
- `next` - Staging/test environment (default)
- `prod` or `production` - Production environment

### 3. Sales Rep Information (Optional but Recommended)
These are used when creating finance applications:

```bash
PALMETTO_SALES_REP_NAME=Austin Elkins
PALMETTO_SALES_REP_EMAIL=austin@kinhome.com
PALMETTO_SALES_REP_PHONE=801-928-6369
```

**Note:** These have defaults in the code, but it's better to set them explicitly.

## Optional Overrides

If you need to override the default API URLs:

```bash
PALMETTO_FINANCE_BASE_URL=https://next.palmetto.finance  # or https://palmetto.finance for prod
PALMETTO_FINANCE_AUTH_URL=https://next.palmetto.finance/api/auth/login
```

## Webhook Configuration (For Status Updates)

If you want to receive webhook notifications when application status changes:

### 1. Webhook API Key
After registering a webhook with Palmetto, you'll receive an `apiKey`:

```bash
LIGHTREACH_WEBHOOK_API_KEY=your-webhook-api-key
```

**How to register:**
1. POST to `{baseUrl}/api/webhooks/registrations` with:
   ```json
   {
     "name": "HVAC Proposal Builder Webhooks",
     "hostUrl": "https://your-domain.com",
     "includeVisibleOrgEvents": true
   }
   ```
2. Subscribe to events:
   ```json
   POST {baseUrl}/api/webhooks/registrations/{id}/subscriptions
   {
     "endpointUrl": "/api/webhooks/finance/lightreach",
     "httpMethod": "POST",
     "eventType": ["allEvents"]
   }
   ```
3. Use the `apiKey` from the registration response

### 2. Alternative: Client ID/Secret (if provided by Palmetto)
```bash
LIGHTREACH_WEBHOOK_CLIENT_ID=your-client-id
LIGHTREACH_WEBHOOK_CLIENT_SECRET=your-client-secret
```

## Summary - What I Need From You

**Minimum Required:**
1. ✅ `PALMETTO_FINANCE_ACCOUNT_EMAIL` - Service account email
2. ✅ `PALMETTO_FINANCE_ACCOUNT_PASSWORD` - Service account password
3. ✅ `PALMETTO_FINANCE_ENVIRONMENT` - `next` (staging) or `prod` (production)

**Recommended:**
4. `PALMETTO_SALES_REP_NAME` - Your name
5. `PALMETTO_SALES_REP_EMAIL` - Your email
6. `PALMETTO_SALES_REP_PHONE` - Your phone

**For Webhooks (Optional):**
7. `LIGHTREACH_WEBHOOK_API_KEY` - After webhook registration

## Where to Add These

1. **Local Development:** Add to `.env.local` file (not committed to git)
2. **Vercel:** Add via Vercel Dashboard → Settings → Environment Variables
   - Make sure to add to Production, Preview, and Development environments

## Testing

Once you provide the credentials, I can:
1. Test authentication
2. Test creating a finance application
3. Test retrieving application status
4. Set up webhooks (if you want status updates)

## Current Status

✅ Code is ready - all integration logic is implemented
⏳ Waiting for credentials to test and activate
