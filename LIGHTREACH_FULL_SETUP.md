# LightReach (Palmetto Finance) – Full Setup & Real Integration

This app uses the **real LightReach/Palmetto Finance API** by default. Mock/test mode is **opt-in only** via `ENABLE_FINANCE_TEST_MODE=true`.

---

## 1. Environment Variables

### Required for real API (apply & status)

| Variable | Description | Example |
|----------|-------------|---------|
| `PALMETTO_FINANCE_ACCOUNT_EMAIL` | Service account email from Palmetto | `your-service@domain.com` |
| `PALMETTO_FINANCE_ACCOUNT_PASSWORD` | Service account password | (from Palmetto) |

**Where to get:** Contact developer-support@palmetto.com for service account credentials.

### Optional – environment & URLs

| Variable | Description | Default |
|----------|-------------|---------|
| `PALMETTO_FINANCE_ENVIRONMENT` | `next` = staging, `prod` = production | `next` (staging) |
| `PALMETTO_FINANCE_BASE_URL` | API base URL | Set from env (next vs prod) |
| `PALMETTO_FINANCE_AUTH_URL` | Auth endpoint | Set from env |

- Staging: `https://next.palmetto.finance`, auth `https://next.palmetto.finance/api/auth/login`
- Production: `https://palmetto.finance`, auth `https://palmetto.finance/api/auth/login`

### Optional – sales rep (sent on application)

| Variable | Description | Example |
|----------|-------------|---------|
| `PALMETTO_SALES_REP_NAME` | Sales rep name | `Austin Elkins` |
| `PALMETTO_SALES_REP_EMAIL` | Sales rep email | `austin@kinhome.com` |
| `PALMETTO_SALES_REP_PHONE` | Sales rep phone | `801-928-6369` |

### Webhook verification (recommended for production)

| Variable | Description |
|----------|-------------|
| `LIGHTREACH_WEBHOOK_API_KEY` | API key returned when you create a webhook registration (recommended) |
| `LIGHTREACH_WEBHOOK_CLIENT_ID` | Optional: client ID if using client headers auth |
| `LIGHTREACH_WEBHOOK_CLIENT_SECRET` | Optional: client secret if using client headers auth |

If none are set, webhook verification is skipped (development only; not safe for production).

### Optional – test mode (mock responses)

| Variable | Description |
|----------|-------------|
| `ENABLE_FINANCE_TEST_MODE` | Set to `true` to use mock apply/status instead of the real API. Use only for local/dev when you don’t have credentials. |

---

## 2. API Endpoints Used in This App

| Purpose | Method | Route | Used by |
|---------|--------|--------|---------|
| Submit application | POST | `/api/finance/lightreach/apply` | FinanceApplicationForm |
| Get application status | GET | `/api/finance/lightreach/status/[applicationId]` | FinanceApplicationStatus |
| Get payment schedule | GET | `/api/finance/lightreach/payment-schedule/[applicationId]` | When approved/conditional |
| Receive webhooks | POST | `/api/webhooks/finance/lightreach` | Palmetto Finance (their server → your app) |

Internal client: `lib/integrations/lightreach.ts` (auth, createApplication, getApplicationStatus, getPricing, getPaymentSchedule).

---

## 3. Webhook Setup (Palmetto → Your App)

Your app already implements the webhook handler. You need to **register** it with Palmetto and store the API key.

### 3.1 Create a webhook registration

Call Palmetto’s API **with your Palmetto auth token** (same credentials as above):

- **Staging:** `POST https://next.palmetto.finance/api/webhooks/registrations`
- **Production:** `POST https://palmetto.finance/api/webhooks/registrations`

Body:

```json
{
  "name": "HVAC Proposal Builder Webhooks",
  "hostUrl": "https://your-app.vercel.app",
  "includeVisibleOrgEvents": true
}
```

Response includes:

- `webhookRegistrationId` – use this for subscriptions
- `apiKey` – **save this once**; it’s only returned here. Set as `LIGHTREACH_WEBHOOK_API_KEY` in your env.

### 3.2 Subscribe to events

- **Staging:** `POST https://next.palmetto.finance/api/webhooks/registrations/{webhookRegistrationId}/subscriptions`
- **Production:** `POST https://palmetto.finance/api/webhooks/registrations/{webhookRegistrationId}/subscriptions`

Body:

```json
{
  "endpointUrl": "/api/webhooks/finance/lightreach",
  "httpMethod": "POST",
  "eventType": ["allEvents"]
}
```

Full webhook URL Palmetto will call: `hostUrl + endpointUrl`  
e.g. `https://your-app.vercel.app/api/webhooks/finance/lightreach`

### 3.3 Events we handle

The handler in `app/api/webhooks/finance/[provider]/route.ts` maps Palmetto events to application status and (optionally) emails:

- `applicationStatus` – approved, declined, conditional, etc.
- `contractSent` / `contractSigned` / `contractApproved` / `contractVoided`
- `quoteVoided` – treat as cancelled
- `milestoneAchieved` – logged

See `LIGHTREACH_WEBHOOKS.md` for full event list and payloads.

---

## 4. How to Test the Real Integration

1. **Get staging credentials**  
   From Palmetto: `PALMETTO_FINANCE_ACCOUNT_EMAIL` and `PALMETTO_FINANCE_ACCOUNT_PASSWORD` for the **staging** (next) environment.

2. **Set env (no test mode)**  
   In `.env.local` or Vercel:
   - `PALMETTO_FINANCE_ACCOUNT_EMAIL=...`
   - `PALMETTO_FINANCE_ACCOUNT_PASSWORD=...`
   - `PALMETTO_FINANCE_ENVIRONMENT=next`
   - Do **not** set `ENABLE_FINANCE_TEST_MODE` (or set it to `false`).

3. **Run the app**  
   Create a proposal, select LightReach leasing, go to Payment or Review, and click **Apply for Comfort Plan**.

4. **Submit a real application**  
   Fill the form with real-looking data (valid phone ≥10 digits, valid email, address, etc.). Submit. You should see either:
   - Success and an application ID from Palmetto, or
   - A clear error from Palmetto (e.g. validation, auth).

5. **Check status**  
   The status page polls `/api/finance/lightreach/status/[applicationId]`, which calls Palmetto’s GET account endpoint. You should see status updates from the real API.

6. **Webhooks (optional but recommended)**  
   Register the webhook (steps above), set `LIGHTREACH_WEBHOOK_API_KEY`, and deploy. Trigger a status change in Palmetto (e.g. approve in their dashboard) and confirm your app receives the webhook and updates the application (and emails if configured).

---

## 5. Checklist – LightReach Fully Set Up

- [ ] **Credentials:** `PALMETTO_FINANCE_ACCOUNT_EMAIL` and `PALMETTO_FINANCE_ACCOUNT_PASSWORD` set (staging or prod).
- [ ] **Environment:** `PALMETTO_FINANCE_ENVIRONMENT` = `next` (staging) or `prod`.
- [ ] **Sales rep (optional):** `PALMETTO_SALES_REP_NAME`, `PALMETTO_SALES_REP_EMAIL`, `PALMETTO_SALES_REP_PHONE` if you want them on applications.
- [ ] **Test mode off:** `ENABLE_FINANCE_TEST_MODE` not set or `false` for real integration.
- [ ] **Webhook registration:** Registration created with Palmetto; `apiKey` saved.
- [ ] **Webhook subscription:** Subscription created with `endpointUrl`: `/api/webhooks/finance/lightreach`, `eventType`: `["allEvents"]`.
- [ ] **Webhook env:** `LIGHTREACH_WEBHOOK_API_KEY` set in production (and staging if you want verification).
- [ ] **Real test:** One application submitted through the app; status and (if applicable) webhook and emails verified.

---

## 6. If Something Fails

- **“LightReach credentials not configured” (503)**  
  Set `PALMETTO_FINANCE_ACCOUNT_EMAIL` and `PALMETTO_FINANCE_ACCOUNT_PASSWORD`, or explicitly use mock mode with `ENABLE_FINANCE_TEST_MODE=true` (dev only).

- **Apply returns 4xx from Palmetto**  
  Check validation (phone ≥10 digits, email, address, state, zip). See `lib/integrations/lightreach.ts` and Palmetto’s docs.

- **Webhook returns 401**  
  Set `LIGHTREACH_WEBHOOK_API_KEY` to the value from your webhook registration (or use client ID/secret if you chose that method).

- **More detail**  
  - API: `LIGHTREACH_API_NOTES.md`  
  - Webhooks: `LIGHTREACH_WEBHOOKS.md`  
  - Credentials: `LIGHTREACH_CREDENTIALS_SETUP.md`
