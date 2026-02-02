# LightReach / Palmetto Finance – Gap Analysis

Review of LightReach docs vs. current app implementation: **what we use**, **what we don’t**, and **recommended next steps**.

---

## 1. What We Use Today

### API

| Feature | Endpoint | Our usage |
|--------|----------|------------|
| Create account (application) | `POST /api/v2/accounts` | ✅ Full: applicants, address, sales rep, `externalReference` / `externalReferenceIds` |
| Get account status | `GET /api/accounts/{accountId}` | ✅ Used for status polling; we map Palmetto status to our status |
| Get HVAC pricing | `POST /api/v2/accounts/{accountId}/pricing/hvac` | ✅ Used with `totalFinancedAmount` only |
| Auth | `POST /api/auth/login` | ✅ Username/password, token cached |

### Webhooks (we handle these)

| Event | Our behavior |
|-------|----------------|
| `applicationStatus` | ✅ Map status → update application, optional email |
| `contractSent` | ✅ Store in `contractStatus`, no email |
| `contractSigned` | ✅ Set status APPROVED, store timestamp, optional email |
| `contractApproved` | ✅ Same as contractSigned |
| `contractVoided` | ✅ Set status CANCELLED, store timestamp, optional email |
| `quoteVoided` | ✅ Set status CANCELLED |
| `milestoneAchieved` | ✅ Log only |

### Not used (or only logged)

- **accountUpdated** – Logged in `default` branch; no merge of `updates` into our data.
- **contractReinstated** – Not handled (voided contract reinstated).
- **milestonePackage** – Not handled (install/activation/PTO package status).
- **quoteCreated** – Not handled.
- **stipulationAdded / stipulationCleared / allStipulationsCleared** – Not handled.
- **requirementCompleted** – Not handled.
- **termsAndConditionsAccepted** – Not handled (PR-specific).
- **activeQuoteExceedsMonthlyPaymentCaps** – Not handled.
- **illinoisShineDisclosureSent / Signed** – Not handled.

---

## 2. API Features We’re Not Using

### 2.1 Account create – optional fields

- **`friendlyName`**  
  Optional human-readable name (e.g. customer name).  
  **Suggestion:** Send `friendlyName: customerData.name` (or similar) so accounts are easier to find in Palmetto.

### 2.2 Pricing – more accurate HVAC pricing

- **`systemDesign`**  
  Docs: *“For more accurate pricing, include a systemDesign object with HVAC system details.”*  
  We only send `totalFinancedAmount`.  
  **Suggestion:** If the HVAC pricing API accepts system design (equipment type, SEER, tonnage, etc.), send it from our proposal so Palmetto can return more accurate payments.

### 2.3 Account status – v2 vs v1

- We use **`GET /api/accounts/{accountId}`** (v1).  
  API reference also has **`GET /api/v2/accounts/{accountId}`**.  
  **Suggestion:** Check v2 response; if it has richer fields (e.g. stipulations, contract link), switch to v2 for status and use that data in the UI.

### 2.4 Stipulations (conditional approval)

- Endpoints: e.g. **`GET /api/accounts/{accountId}/stipulations`**, **`PATCH`** for stipulations, plus application-level stipulation endpoints.  
  Conditional approvals often require documents or tasks.  
  **Suggestion:**  
  - Call stipulations API when status is conditional (or when we get `stipulationAdded` / `stipulationCleared` webhooks).  
  - Show list of stipulations and links/instructions to complete them (if Palmetto provides URLs or tasks).

### 2.5 Contract – send & signing link

- **`GET /api/accounts/{accountId}/contracts/current/signing-link`**  
- **`POST /api/accounts/{accountId}/contracts/current/send`**  
  **Suggestion:**  
  - When status is approved/conditional and contract is ready, call “signing link” and show a **“Sign contract”** button that opens Palmetto’s signing flow.  
  - Optionally add **“Send contract”** (if your flow is to send from the app).

### 2.6 Quotes

- Endpoints: **`GET /api/accounts/{accountId}/quotes`**, **`GET /api/v2/accounts/{accountId}/quotes/hvac`**, etc.  
  **Suggestion:** If you want to show quote details (amounts, product) in the app, add a quote fetch when the account has an active quote and display it in the finance status view.

### 2.7 Activity / documents

- **`GET /api/accounts/{accountId}/activity`** – audit trail.  
- **`GET /api/accounts/{accountId}/documents`** – list documents.  
  **Suggestion:** Optional “Activity” or “Documents” section in the finance application view for admins.

### 2.8 Milestones (install / activation / PTO)

- **Install package:** e.g. **`GET /api/accounts/{accountId}/install-package`**.  
- **Activation package:** e.g. **`GET /api/accounts/{accountId}/activation-package`**.  
  Webhooks: **`milestoneAchieved`** (noticeToProceed, install, activation), **`milestonePackage`** (submitted, approved, etc.).  
  **Suggestion:**  
  - Store `milestoneAchieved` and `milestonePackage` in `responseData` (e.g. `milestones`).  
  - Show a simple “Milestones” line (e.g. “Notice to proceed”, “Install”, “Activation”) in the status UI when data is present.

---

## 3. Webhook Handling – Suggested Additions

| Event | Suggested handling |
|-------|--------------------|
| **accountUpdated** | Merge `body.updates` into `responseData` (or refetch status) so we keep account details in sync. |
| **contractReinstated** | Set status back from CANCELLED to APPROVED (or a “reinstated” state) and update `contractStatus`. |
| **milestonePackage** | Store in `responseData.milestonePackages` (or similar); show in UI (e.g. “Install package: approved”). |
| **quoteCreated** | Store `quoteId` in `responseData` for reference; optional “View quote” later. |
| **stipulationAdded / stipulationCleared / allStipulationsCleared** | Refetch stipulations (or re-fetch account) and update UI so the user sees what’s left to complete. |
| **requirementCompleted** | Refetch account or merge into `responseData`; optional “Requirements” progress in UI. |
| **termsAndConditionsAccepted** | Log and optionally update a “PR terms accepted” flag in `responseData`. |
| **activeQuoteExceedsMonthlyPaymentCaps** | Notify (e.g. toast or admin email) that quote exceeds cap. |

---

## 4. Configuration / Setup We’re Not Using

- **Webhook auth:** We support API key and (optionally) client headers / Basic. We don’t use **client-provided** `clientId`/`clientSecret` in registration; that’s optional and already documented.  
- **Subscription eventType:** We recommend `allEvents` so we receive every event and can add handlers without re-registering. If you currently subscribe to a subset, consider switching to `allEvents` and handling new events as above.

---

## 5. Priority Summary

| Priority | Item | Why |
|----------|------|-----|
| High | **friendlyName** on create | Better identification in Palmetto; no extra API surface. |
| High | **Handle accountUpdated** | Keep our copy of account data in sync with Palmetto. |
| High | **Stipulations API + UI** | Conditional approvals need clear “what to do next” for the user. |
| Medium | **Contract signing link** | Let customer sign from our app (one less place to log in). |
| Medium | **contractReinstated** | Correct status when a voided contract is reinstated. |
| Medium | **systemDesign** on pricing | More accurate payments if API supports it. |
| Low | **v2 GET account** | Richer status/stipulations/contract info if v2 has it. |
| Low | **Milestone + milestonePackage** | Visibility into install/activation progress. |
| Low | **quoteCreated / quoteId** | Foundation for future “View quote” or quote-based UI. |

---

## 6. Implementation Status (Post-Gap Work)

The following have been implemented:

- **friendlyName on create:** Set from proposal `customerData.name` or `firstName` + `lastName` in apply route; sent in `createApplication` payload.
- **systemDesign on pricing:** Optional third parameter on `getPricing(accountId, totalFinancedAmount, systemDesign?)` in LightReach client; callers can pass proposal equipment data when available.
- **accountUpdated webhook:** Merges `body.updates` into responseData and stores `accountUpdatedAt`.
- **contractReinstated webhook:** Sets status to APPROVED and stores `contractStatus.reinstated` / `reinstatedAt`; UI shows “Contract reinstated.”
- **milestonePackage / milestoneAchieved:** Stored in `responseData.milestonePackages` and `responseData.milestones`; UI shows “Milestones” section.
- **quoteCreated:** Stores `quoteId` and `quoteReference` in responseData.
- **stipulationAdded / stipulationCleared / allStipulationsCleared:** Stores `stipulationsUpdatedAt` so UI can refetch; stipulations fetched via API when status is conditional/approved.
- **requirementCompleted / termsAndConditionsAccepted / activeQuoteExceedsMonthlyPaymentCaps:** Stored in responseData; UI shows warning when `quoteExceedsPaymentCap` is set.
- **Stipulations API + UI:** `GET /api/finance/lightreach/stipulations/[applicationId]`; FinanceApplicationStatus fetches and displays stipulations when LightReach and status is conditional/approved.
- **Signing link API + UI:** `GET /api/finance/lightreach/signing-link/[applicationId]`; “Sign contract” button in FinanceApplicationStatus opens Palmetto signing page.
- **Contract reinstated:** Shown in contract status timeline when `contractStatus.reinstated` is true.

---

## 7. References

- **API:** `LightReach API Reference (Prod)` (OpenAPI), `LIGHTREACH_API_NOTES.md`
- **Webhooks:** `LIGHTREACH_WEBHOOKS.md`, `LightReach Webhooks`
- **Setup:** `LIGHTREACH_FULL_SETUP.md`
