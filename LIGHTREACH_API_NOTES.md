# LightReach/Palmetto Finance API Implementation Notes

Based on the official API reference documentation.

## Authentication

- **Method**: OAuth2 with username/password
- **Auth Endpoint**: 
  - Production: `https://palmetto.finance/api/auth/login`
  - Staging: `https://next.palmetto.finance/api/auth/login`
- **Request**: POST with `{ username, password }`
- **Response**: `{ access_token, token_type?, expires_in? }`
- **Token Usage**: Include in Authorization header as `Bearer {access_token}`

## Key Endpoints

### Create Account (v2 - Recommended)
- **Endpoint**: `POST /api/v2/accounts/`
- **Required Fields**:
  - `programType`: `"hvac"` for HVAC applications
  - `applicants`: Array with at least one primary applicant
    - `type`: `"primary"` or `"secondary"`
    - `firstName`, `lastName`, `phoneNumber`, `email`: Required
    - `address`: Object with `state` required
  - `salesRepName`: Required
- **Optional Fields**:
  - `externalReference`: String to link back to proposal ID
  - `externalReferenceIds`: Array of `{ type, id }` objects
  - `address`: Property address (separate from applicant address)
  - `friendlyName`: Human-readable account name
  - `systemDesign`: HVAC system design (home size, conditioned area, equipment) so the LightReach portal System Design tab is pre-populated; built from proposal `homeData` and `selectedEquipment` when submitting from the app

### Get Account Status
- **Endpoint**: `GET /api/accounts/{accountId}`
- **Returns**: Account object with `id`, `status`, and full account details
- **Status Values**: 
  - `"1 - Created"` → `pending`
  - `"2 - Credit Approved"` → `approved`
  - `"3 - Credit Approved"` → `approved`
  - `"4 - Credit Denied"` → `denied`
  - `"Terms & Conditions Accepted"` → `submitted`
  - `"5 - Contract Created"` → `submitted`
  - `"6 - Contract Sent"` → `submitted`
  - `"7 - Contract Signed"` → `approved`
  - `"8 - Contract Approved"` → `approved`
  - `"99 - Credit Expired"` → `cancelled`

### Get Pricing (HVAC)
- **Endpoint**: `POST /api/v2/accounts/{accountId}/pricing/hvac`
- **Request Body**: 
  ```json
  {
    "totalFinancedAmount": 15000.00,
    "systemDesign": { ... } // Optional, for more accurate pricing
  }
  ```
- **Response**: Array of finance products, each containing:
  - `productId`: Product identifier
  - `name`: Product name
  - `monthlyPayments`: Array of `{ year, monthlyPayment, totalMonthlyPayment }`
  - `escalationRate`: Annual escalation rate
  - `totalEPCPayment`: Total payment to EPC
  - Other product details

### Payment Schedule
- **Note**: Payment schedule is retrieved via the pricing endpoint
- The `monthlyPayments` array in the pricing response provides year-by-year payment breakdown
- Each entry contains:
  - `year`: The year of the agreement (0-based, where 0 is year 1)
  - `monthlyPayment`: Monthly payment for that year
  - `totalMonthlyPayment`: Total including any adders

## Important Notes

1. **v1 Endpoints Deprecated**: The `/api/accounts/` POST endpoint is deprecated. Always use `/api/v2/accounts/` for creating accounts.

2. **Program Type**: Must be set to `"hvac"` for HVAC finance applications.

3. **Sales Rep Info**: `salesRepName` is required. Can be set via:
   - `applicationData.salesRepName`
   - Environment variable `PALMETTO_SALES_REP_NAME`
   - Defaults to `"Sales Rep"` if not provided

4. **External References**: Use `externalReference` and `externalReferenceIds` to link Palmetto accounts back to your proposal system.

5. **Email Formatting**: Email addresses are automatically lowercased and trimmed by the API.

6. **Address Requirements**: 
   - Applicant address: `state` is required
   - Property address: `state` is required
   - Both can be the same

7. **Pricing**: Pricing is calculated based on `totalFinancedAmount`. For more accurate pricing, include a `systemDesign` object with HVAC system details.

## Environment Variables

```bash
# Required
PALMETTO_FINANCE_ACCOUNT_EMAIL=your-service-account@domain.com
PALMETTO_FINANCE_ACCOUNT_PASSWORD=your-service-account-password
PALMETTO_FINANCE_ENVIRONMENT=next  # or 'prod'

# Optional - Sales Rep Info (if not provided in application data)
PALMETTO_SALES_REP_NAME=Austin Elkins
PALMETTO_SALES_REP_EMAIL=austin@kinhome.com
PALMETTO_SALES_REP_PHONE=801-928-6369

# Optional - Override URLs
PALMETTO_FINANCE_BASE_URL=https://next.palmetto.finance
PALMETTO_FINANCE_AUTH_URL=https://next.palmetto.finance/api/auth/login
```

## Webhook Configuration

### Webhook Registration

1. Create a webhook registration:
   ```bash
   POST {envBaseUrl}/api/webhooks/registrations
   {
     "name": "HVAC Proposal Builder Webhooks",
     "hostUrl": "https://your-domain.com",
     "includeVisibleOrgEvents": true
   }
   ```

2. Subscribe to events:
   ```bash
   POST {envBaseUrl}/api/webhooks/registrations/{webhookRegistrationId}/subscriptions
   {
     "endpointUrl": "/api/webhooks/finance/lightreach",
     "httpMethod": "POST",
     "eventType": ["allEvents"]  # or specific events like ["applicationStatus", "milestoneAchieved"]
   }
   ```

3. Store the `apiKey` from registration response as `LIGHTREACH_WEBHOOK_API_KEY`

### Webhook Endpoint

- **URL**: `/api/webhooks/finance/lightreach`
- **Method**: POST
- **Authentication**: `apiKey` header (from webhook registration)

### Supported Events

- `applicationStatus` - Credit application status changes (approved, declined, etc.)
- `milestoneAchieved` - Account milestones (noticeToProceed, install, activation)
- `quoteVoided` - Quote cancellation
- `contractSigned` - Contract signed by customer
- `contractApproved` - Contract approved by Palmetto
- `accountUpdated` - Any account updates

## Implementation Status

✅ Authentication with OAuth2 token caching
✅ Account creation using v2 endpoint
✅ Account status retrieval
✅ Pricing retrieval with monthly payment schedule
✅ Payment schedule extraction from pricing data
✅ Status mapping from Palmetto format to internal format
✅ External reference linking to proposals
✅ Error handling and validation
✅ Logging with sensitive data redaction
✅ Webhook handler updated for LightReach event format
✅ Webhook authentication (API key, client headers, or Basic auth)
✅ Event-based status updates
