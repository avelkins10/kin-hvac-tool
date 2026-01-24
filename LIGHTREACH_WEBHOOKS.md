# LightReach Webhooks Documentation

## Create a Registration

The first step to setting up webhooks calls to your system is to create a registration. The registration is then used to subscribe to various types events. Registrations belong to a specific organization, pulled from the Auth token used when creating the registration. All events are scoped to resources inside this organization UNLESS the `includeVisibleOrgEvents` registration setting is set to `true`, in which case you'll receive events for any organization to which the registered org has been granted access.

### Example Registration Request

```javascript
import fetch from 'node-fetch';

const url = `{envBaseUrl}/api/webhooks/registrations`;
const response = await fetch(url, {
  method: 'post',
  body: JSON.stringify({
    name: 'a descriptive name',
    hostUrl: 'https://my.domain.com',
    includeVisibleOrgEvents: true,
  }),
  headers: { 'Content-Type': 'application/json' },
});
const data = await response.json();
console.log(data);
```

The response will contain the `webhookRegistrationId` of the client, which is used to subscribe to events. As well as the `apiKey` which is used to verify webhook calls came from the palmetto finance API. Calls to your service will be made with an `api_key` header set to the value of the `apiKey` returned here. The `hostURL` parameter should include only the portion of the URL that includes the domain. You will include the remaining path for your URL in the `endpointURL` parameter in the subscription, as shown below.

## Authentication

In addition to HTTPS verifying that the origin is Palmetto, you can verify that the requests originate from your API registration. There are 3 authentication mechanisms available:

1. **Server API key** (default)
2. **Client headers**
3. **Client basic authorization header**

An overview of each follows. For more detailed implementation information, see the API Reference.

### Server API key

This is the default if you don't specify an authentication method.

Palmetto generates an API key. It is returned from the registration endpoint, and only once. Store this value, and then on webhook events to your endpoint, an `apiKey` header will be sent with the API key as the value.

### Client headers

You provide a client ID and a client secret in your registration request. Palmetto stores these and on webhook events to your endpoint, two headers, `clientId` and `clientSecret`, will be sent with the respective values.

### Client basic authorization header

Similar to client headers, you provide a client ID and a client secret. Palmetto stores these and on webhook events to your endpoint, a single `Authorization` header will be sent with a base64 encoding of the two values concatenated together: `{clientId}:{clientSecret}`.

## Subscribe to Events

Once you have a registration, you then subscribe to one or more events. There is a catch all, `allEvents` that we recommend as a starting point for most partners, or you can subscribe to specific events listed further down in this page.

### Example Subscription Request

```javascript
import fetch from 'node-fetch';

const url = `{envBaseUrl}/api/webhooks/registrations/{webhookRegistrationId}/subscriptions`;
const response = await fetch(url, {
  method: 'post',
  body: JSON.stringify({
    endpointUrl: '/myexample/lightreach/receiver',
    httpMethod: 'POST',
    eventType: ['allEvents'],
  }),
  headers: { 'Content-Type': 'application/json' },
});
```

The full URL to your webhook receiver service will be the `registration.hostURL + subscription.endpointURL`. Per our example above, the complete URL we will send events for this subscription would be `https://my.domain.com/myexample/lightreach/receiver`.

## Event Types

For a full list of events, see the schema in the API reference.

| Event Name | Description |
|------------|-------------|
| `accountUpdated` | any updates to an account |
| `activeQuoteExceedsMonthlyPaymentCaps` | quote for account exceeds monthly payment cap |
| `allEvents` | subscribe to all events at this path |
| `allConsumerTaskEvents` | subscribe to all consumer events at this path |
| `allContractEvents` | subscribe to all contract events at this path |
| `allStipulationEvents` | subscribe to all stipulation events at this path |
| `allStipulationsCleared` | all stipulations have been cleared |
| `applicationStatus` | any application status changes |
| `contractApproved` | any contract approved |
| `contractReinstated` | a previously voided contract is reinstated |
| `contractSent` | any contract sent |
| `contractSigned` | any contract signed |
| `contractVoided` | any contract voided |
| `illinoisShineDisclosureSent` | Illinois Shines disclosure sent |
| `illinoisShineDisclosureSigned` | Illinois Shines disclosure signed |
| `milestoneAchieved` | any milestone reached |
| `milestonePackage` | events for milestone packages |
| `quoteCreated` | any quote created |
| `quoteVoided` | any quote voided |
| `requirementCompleted` | any account requirement completed |
| `stipulationAdded` | a single stipulation added |
| `stipulationCleared` | a single stipulation cleared |
| `termsAndConditionsAccepted` | terms and conditions accepted |

## Webhook Event Payloads

### Account Events

#### Account Updated

This webhook is sent whenever an account is updated.

```json
{
  "event": "accountUpdated",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "updates": { "... any fields updated on the account" },
  "primaryApplicantEmail": "primary-applicant-email-address",
  "organizationId": "org-id"
}
```

### Application Events

#### Application Status Event

This webhook is sent whenever there is a change in the status of a credit application.

```json
{
  "event": "applicationStatus",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "applicationReference": "application-external-reference",
  "applicationId": "palmetto-finance-application-id",
  "applicants": [
    {
      "type": "primary",
      "firstName": "Maynard",
      "lastName": "Crown",
      "phoneNumber": "5555550001",
      "email": "maynard@crownpawn.com",
      "address": {
        "address1": "20933 Roscoe Blvd",
        "city": "Canoga Park",
        "state": "MA",
        "zip": "02779"
      }
    }
  ],
  "status": "approved | approvedWithStipulations | creditFrozen | declined | expired"
}
```

### Contract Events

#### Contract Approved Event

This webhook is sent when a signed contract has been approved by Palmetto Finance.

```json
{
  "event": "contractApproved",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "contractReference": "externalReference-provided-in-contract-send",
  "quoteReference": "quote-external-reference"
}
```

#### Contract Sent Event

This webhook is sent when a contract has been sent to the consumer for signature.

```json
{
  "event": "contractSent",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "contractReference": "externalReference-provided-in-contract-send",
  "quoteReference": "quote-external-reference"
}
```

#### Contract Signed Event

This webhook is sent when a contract document has been digitally signed by the consumer.

```json
{
  "event": "contractSigned",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "contractReference": "externalReference-provided-in-contract-send",
  "quoteReference": "quote-external-reference"
}
```

#### Contract Voided Event

This webhook is sent when a contract is voided.

```json
{
  "event": "contractVoided",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "contractId": "palmetto-finance-contract-id",
  "contractReference": "externalReference-provided-in-contract-send",
  "message": "Contract has been voided",
  "quoteId": "palmetto-finance-associated-quote-id",
  "quoteReference": "quote-external-reference",
  "status": "voided"
}
```

#### Contract Reinstated Event

This webhook is sent when a voided contract is reinstated.

```json
{
  "event": "contractReinstated",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "contractId": "palmetto-finance-contract-id",
  "contractReference": "externalReference-provided-in-contract-send",
  "organizationId": "org-id"
}
```

### Milestone Package Events

#### Milestone Package Event

This webhook is sent whenever an action (submission, review, resubmission, approval) happens for a milestone package (install, activation, permission to operate).

```json
{
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "event": "milestonePackage",
  "status": "submitted",
  "timestamp": "2025-01-01",
  "type": "installPackage",
  "flags": "document rejected"
}
```

**Status values:** `submitted`, `resubmitted`, `rejected`, `approved`, `conditionallyApproved`

**Type values:** `installPackage`, `activationPackage`, `permissionToOperate`

### Quote Events

#### Quote Created Event

This webhook is sent whenever a quote has been created.

```json
{
  "event": "quoteCreated",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "quoteId": "palmetto-finance-quote-id",
  "quoteReference": "",
  "status": "active",
  "message": "A new quote has been created",
  "contractId": "corresponding-contract-id",
  "contractReference": "corresponding-contract-external-reference"
}
```

#### Active Quote Exceeds Monthly Payment Cap

This webhook is sent when a quote is created for an account that exceeds their monthly payment cap.

```json
{
  "event": "activeQuoteExceedsMonthlyPaymentCaps",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "monthlyPaymentCap": {
    "zeroEscalationRate": 50000,
    "greaterThanZeroEscalationRate": 50000
  },
  "activeQuoteId": "palmetto-finance-quote-id"
}
```

#### Quote Voided Event

This webhook is sent whenever an ordered quote has been voided.

```json
{
  "event": "quoteVoided",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "quoteId": "palmetto-finance-quote-id",
  "quoteReference": "",
  "status": "voided",
  "message": "The quote has been voided"
}
```

### Milestone Events

#### Milestone Achieved Event

This webhook is sent whenever an account has reached a major milestone (noticeToProceed, install, or activation).

```json
{
  "accountId": "66f48069ce77cd1b54fff222",
  "accountReference": "",
  "event": "milestoneAchieved",
  "newMilestone": "noticeToProceed",
  "organizationId": "my-lightreach-alias"
}
```

**Milestone values:** `noticeToProceed`, `install`, `activation`

### Terms and Conditions

#### Terms and Conditions Accepted

This webhook is sent whenever an account in Puerto Rico accepts the LightReach terms and conditions.

```json
{
  "event": "termsAndConditionsAccepted",
  "accountId": "palmetto-finance-account-id",
  "accountReference": "account-external-reference",
  "doeReferenceId": "doe-reference-id",
  "dateAccepted": "date-time-accepted"
}
```

## Implementation Notes

### Key Fields

- **`accountId`**: The Palmetto Finance account ID (this is what we store as `externalApplicationId`)
- **`accountReference`**: The external reference we provide when creating accounts (our proposal ID)
- **`event`**: The event type (e.g., `applicationStatus`, `milestoneAchieved`, `quoteVoided`)
- **`apiKey` header**: Used for authentication (from webhook registration)

### Finding Applications

When a webhook is received:
1. Use `accountReference` to find the proposal (this is our `externalReference`)
2. Use `accountId` to find the finance application (this is stored as `externalApplicationId`)
3. Update the application status based on the event type

### Status Mapping

For `applicationStatus` events:
- `approved` → `APPROVED`
- `approvedWithStipulations` → `CONDITIONAL`
- `declined` → `DENIED`
- `expired` → `CANCELLED`
- `creditFrozen` → `PENDING`
