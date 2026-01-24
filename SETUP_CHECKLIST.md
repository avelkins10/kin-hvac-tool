# Setup Checklist - Features & Integrations

## ✅ Fully Implemented & Ready

### Core Features
- ✅ **Authentication System** - NextAuth with role-based access
- ✅ **User Management** - Create, update, delete users
- ✅ **Proposal Management** - Full CRUD with version history
- ✅ **Database** - Prisma + PostgreSQL (Neon) schema complete
- ✅ **Dashboard** - Stats, recent proposals, navigation
- ✅ **Pipeline/Kanban Board** - Visual workflow management
- ✅ **Client Management** - Customer list and details
- ✅ **Company Configuration** - Admin portal for pricing, equipment, etc.

### AI Features
- ✅ **Nameplate Analysis** - OpenAI integration for analyzing HVAC nameplates
  - **Status**: Fully implemented
  - **API Route**: `/api/analyze-nameplate`
  - **Setup Needed**: Just add `OPENAI_API_KEY` to environment variables

### Integrations - Code Complete
- ✅ **LightReach Finance** - API client implemented
- ✅ **SignNow E-Signature** - API client implemented  
- ✅ **Email System** - Nodemailer configured
- ✅ **PDF Generation** - Agreement generator ready

---

## ⚠️ Needs Configuration/Setup

### 1. Environment Variables (Required for Full Functionality)

**Already Set:**
- ✅ `DATABASE_URL` - Neon PostgreSQL
- ✅ `NEXTAUTH_SECRET` - Auth secret
- ✅ `NEXTAUTH_URL` - App URL

**Still Need to Add:**

#### OpenAI (for AI nameplate analysis)
```
OPENAI_API_KEY=sk-your-key-here
```
- **Where to get**: https://platform.openai.com/api-keys
- **Status**: Code ready, just needs API key

#### SignNow (for e-signatures)
```
SIGNNOW_API_HOST=https://api.signnow.com
SIGNNOW_BASIC_TOKEN=your-basic-token
SIGNNOW_USERNAME=your-username
SIGNNOW_PASSWORD=your-password
SIGNNOW_FROM_EMAIL=your-email@example.com
```
- **Where to get**: SignNow account dashboard
- **Status**: Code ready, needs credentials
- **Action**: Create SignNow account, get API credentials

#### Email/SMTP (for sending proposals)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```
- **Where to get**: 
  - Gmail: Use App Password (not regular password)
  - SendGrid: Use their SMTP settings
  - Other: Your email provider's SMTP settings
- **Status**: Code ready, needs SMTP credentials

#### LightReach (for financing)
```
LIGHTREACH_API_KEY=your-api-key
LIGHTREACH_BASE_URL=https://api.lightreach.com/v1
```
- **Where to get**: LightReach account dashboard
- **Status**: Code ready, needs API key
- **Action**: Create LightReach account, get API credentials

---

## 🔧 Incomplete Features (TODOs Found)

### 1. Webhook Security
**File**: `app/api/webhooks/signnow/route.ts`
- ⚠️ **Missing**: Webhook signature verification
- **Line 12**: `// TODO: Implement webhook signature verification`
- **Impact**: Webhooks are currently unverified (security risk)
- **Action**: Implement SignNow webhook signature verification

### 2. Email Notifications
**File**: `app/api/webhooks/signnow/route.ts`
- ⚠️ **Missing**: Email notification when document is signed
- **Line 57**: `// TODO: Send email notification when document is signed`
- **Impact**: No email sent to customer/sales rep when proposal is signed
- **Action**: Add email notification using `emailClient`

**File**: `app/api/webhooks/finance/[provider]/route.ts`
- ⚠️ **Missing**: Email notification for finance approvals
- **Line 41**: Comment mentions sending email but not implemented
- **Impact**: No email when financing is approved
- **Action**: Implement `emailClient.sendFinanceApprovalEmail()`

### 3. Additional Finance Providers
**File**: `lib/integrations/finance-factory.ts`
- ⚠️ **Status**: Only LightReach implemented
- **Available slots**: Synchrony, GreenSky, Mosaic (commented out)
- **Action**: Implement additional providers as needed

---

## 🧪 Testing Needed

### Integration Testing
1. **OpenAI Nameplate Analysis**
   - [ ] Test with real nameplate photo
   - [ ] Verify AI response parsing
   - [ ] Test error handling

2. **SignNow E-Signature**
   - [ ] Test document upload
   - [ ] Test signature request sending
   - [ ] Test webhook receiving
   - [ ] Test document download

3. **Email System**
   - [ ] Test proposal email sending
   - [ ] Test signature request email
   - [ ] Test finance approval email
   - [ ] Verify email delivery

4. **LightReach Finance**
   - [ ] Test application submission
   - [ ] Test status checking
   - [ ] Test webhook receiving

5. **Proposal Workflow**
   - [ ] Create → Save → Send → Sign → Accept
   - [ ] Test version history
   - [ ] Test proposal duplication

---

## 📋 Setup Steps (In Order)

### Step 1: Core Setup (Already Done ✅)
- [x] Database configured
- [x] Authentication working
- [x] Basic features deployed

### Step 2: Add API Keys & Credentials
1. **OpenAI**
   - Create account at https://platform.openai.com
   - Generate API key
   - Add to Vercel environment variables

2. **SignNow**
   - Create account at https://www.signnow.com
   - Get API credentials from dashboard
   - Add all SignNow variables to Vercel

3. **Email/SMTP**
   - Choose provider (Gmail, SendGrid, etc.)
   - Get SMTP credentials
   - Add SMTP variables to Vercel

4. **LightReach**
   - Create account (if using financing)
   - Get API key
   - Add to Vercel

### Step 3: Configure Webhooks
1. **SignNow Webhook**
   - Go to SignNow dashboard → Webhooks
   - Add webhook URL: `https://your-app.vercel.app/api/webhooks/signnow`
   - Subscribe to events:
     - `document.complete`
     - `document.decline`
     - `document.field_invite.complete`

2. **LightReach Webhook** (if supported)
   - Configure in LightReach dashboard
   - URL: `https://your-app.vercel.app/api/webhooks/finance/lightreach`

### Step 4: Complete TODOs
1. **Implement webhook signature verification**
   - Add security to SignNow webhook handler
   - Verify webhook signatures before processing

2. **Add email notifications**
   - Send email when document is signed
   - Send email when financing is approved

### Step 5: Test Everything
- [ ] Test AI nameplate analysis
- [ ] Test proposal creation and saving
- [ ] Test sending proposal to customer
- [ ] Test signature request flow
- [ ] Test finance application flow
- [ ] Test webhook handlers
- [ ] Test email delivery

---

## 🎯 Quick Start Guide

### Minimum Setup (Core Features Only)
If you just want basic proposal management:
- ✅ Already have: Database, Auth, Proposals
- **No additional setup needed!**

### Full Setup (All Features)
To enable all features:

1. **Add OpenAI API Key** (for AI nameplate analysis)
   ```bash
   # In Vercel Dashboard
   OPENAI_API_KEY=sk-...
   ```

2. **Add SignNow Credentials** (for e-signatures)
   ```bash
   SIGNNOW_API_HOST=https://api.signnow.com
   SIGNNOW_BASIC_TOKEN=...
   SIGNNOW_USERNAME=...
   SIGNNOW_PASSWORD=...
   SIGNNOW_FROM_EMAIL=...
   ```

3. **Add SMTP Credentials** (for emails)
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=...
   SMTP_PASSWORD=...
   SMTP_FROM=...
   ```

4. **Add LightReach API Key** (for financing)
   ```bash
   LIGHTREACH_API_KEY=...
   LIGHTREACH_BASE_URL=https://api.lightreach.com/v1
   ```

5. **Configure Webhooks** (in external services)
   - SignNow: Add webhook URL in dashboard
   - LightReach: Add webhook URL if supported

---

## 📊 Feature Status Summary

| Feature | Code Status | Setup Status | Notes |
|---------|------------|--------------|-------|
| Authentication | ✅ Complete | ✅ Configured | Working |
| User Management | ✅ Complete | ✅ Configured | Working |
| Proposals | ✅ Complete | ✅ Configured | Working |
| AI Nameplate | ✅ Complete | ⚠️ Needs API Key | Add OpenAI key |
| SignNow | ✅ Complete | ⚠️ Needs Credentials | Add SignNow account |
| Email | ✅ Complete | ⚠️ Needs SMTP | Add SMTP config |
| LightReach | ✅ Complete | ⚠️ Needs API Key | Add LightReach key |
| Webhook Security | ⚠️ TODO | ❌ Not Done | Implement verification |
| Email Notifications | ⚠️ TODO | ❌ Not Done | Add to webhooks |

---

## 🚀 Next Actions

**Priority 1 (Core Functionality):**
1. Add OpenAI API key (if using AI nameplate analysis)
2. Add SMTP credentials (if sending emails)
3. Test proposal creation and saving

**Priority 2 (Enhanced Features):**
1. Set up SignNow account and credentials
2. Set up LightReach account and API key
3. Configure webhooks in external services

**Priority 3 (Security & Polish):**
1. Implement webhook signature verification
2. Add email notifications to webhooks
3. Test end-to-end workflows

---

## 💡 Notes

- **All code is implemented** - You just need to add API keys/credentials
- **Webhook security** should be implemented before production
- **Email notifications** enhance user experience but aren't critical
- **Additional finance providers** can be added as needed (factory pattern ready)
