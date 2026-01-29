# Neon Database Structure Analysis

## Overview

**Total Tables**: 30
- **Public Schema**: 21 application tables
- **Neon Auth Schema**: 9 tables (Neon's built-in auth system - can be ignored)

## Public Schema Tables (21)

### Core Tables

1. **User** (3 rows)
   - Columns: id, email, password, role (UserRole enum), companyId, createdAt, updatedAt, emailVerified, name, image
   - Indexes: Primary key (id), Unique (email), Index (companyId, email)
   - Foreign Keys: companyId → Company.id (CASCADE)

2. **Company** (1 row)
   - Columns: id, name, settings (jsonb), createdAt, updatedAt
   - Indexes: Primary key (id)
   - No foreign keys

3. **Proposal** (4 rows)
   - Columns: id, userId, companyId, status (ProposalStatus enum), 12 jsonb fields, createdAt, updatedAt, expiresAt
   - JSONB Fields: customerData, homeData, hvacData, solarData, electricalData, preferencesData, selectedEquipment, addOns, maintenancePlan, incentives, paymentMethod, financingOption, totals, nameplateAnalysis
   - Indexes: Primary key (id), Index (userId, companyId, status, createdAt)
   - Foreign Keys: userId → User.id (CASCADE), companyId → Company.id (CASCADE)

4. **ProposalVersion** (5 rows)
   - Columns: id, proposalId, versionNumber, data (jsonb), createdAt
   - Indexes: Primary key (id), Unique (proposalId, versionNumber), Index (proposalId)
   - Foreign Keys: proposalId → Proposal.id (CASCADE)

### Company Configuration Tables

5. **HVACSystem** (3 rows)
   - Columns: id, companyId, name, tier, baseCost, marginType, marginAmount, createdAt, updatedAt
   - Indexes: Primary key (id), Index (companyId)
   - Foreign Keys: companyId → Company.id (CASCADE)

6. **AddOn** (6 rows)
   - Columns: id, companyId, name, baseCost, marginType, marginAmount, createdAt, updatedAt
   - Indexes: Primary key (id), Index (companyId)
   - Foreign Keys: companyId → Company.id (CASCADE)

7. **Material** (5 rows)
   - Columns: id, companyId, name, cost, unit, createdAt, updatedAt
   - Indexes: Primary key (id), Index (companyId)
   - Foreign Keys: companyId → Company.id (CASCADE)

8. **LaborRate** (3 rows)
   - Columns: id, companyId, name, rate, createdAt, updatedAt
   - Indexes: Primary key (id), Index (companyId)
   - Foreign Keys: companyId → Company.id (CASCADE)

9. **PermitFee** (3 rows)
   - Columns: id, companyId, name, cost, createdAt, updatedAt
   - Indexes: Primary key (id), Index (companyId)
   - Foreign Keys: companyId → Company.id (CASCADE)

10. **PriceBookUnit** (16 rows)
    - Columns: id, companyId, brand, model, tonnage, tier, baseCost, createdAt, updatedAt
    - Indexes: Primary key (id), Index (companyId), Index (brand, model)
    - Foreign Keys: companyId → Company.id (CASCADE)

11. **FinancingOption** (5 rows)
    - Columns: id, companyId, name, type, terms (jsonb), apr, createdAt, updatedAt
    - Indexes: Primary key (id), Index (companyId)
    - Foreign Keys: companyId → Company.id (CASCADE)

12. **MaintenancePlan** (0 rows)
    - Columns: id, companyId, name, tier, baseCost, marginType, marginAmount, createdAt, updatedAt
    - Indexes: Primary key (id), Index (companyId)
    - Foreign Keys: companyId → Company.id (CASCADE)

13. **Incentive** (0 rows)
    - Columns: id, companyId, name, amount, type, description, createdAt, updatedAt
    - Indexes: Primary key (id), Index (companyId)
    - Foreign Keys: companyId → Company.id (CASCADE)

### Transaction Tables

14. **FinanceApplication** (7 rows)
    - Columns: id, proposalId, lenderId, externalApplicationId, status (FinanceApplicationStatus enum), applicationData (jsonb), responseData (jsonb), createdAt, updatedAt
    - Indexes: Primary key (id), Index (proposalId, status, externalApplicationId)
    - Foreign Keys: proposalId → Proposal.id (CASCADE)

15. **SignatureRequest** (0 rows)
    - Columns: id, proposalId, provider, envelopeId, status (SignatureRequestStatus enum), documentUrl, signedDocumentUrl, signers (jsonb), createdAt, completedAt
    - Indexes: Primary key (id), Index (proposalId, status, envelopeId)
    - Foreign Keys: proposalId → Proposal.id (CASCADE)

16. **Payment** (0 rows)
    - Columns: id, proposalId, amount, method, status (PaymentStatus enum), transactionId, createdAt
    - Indexes: Primary key (id), Index (proposalId, status)
    - Foreign Keys: proposalId → Proposal.id (CASCADE)

17. **Notification** (0 rows)
    - Columns: id, userId, companyId, type, title, message, read, data (jsonb), createdAt
    - Indexes: Primary key (id), Index (userId, companyId, read)
    - No foreign keys (optional relationships)

### NextAuth Tables (To Be Removed)

18. **Account** (0 rows) - NextAuth adapter table
    - Columns: id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
    - Indexes: Primary key (id), Unique (provider, providerAccountId), Index (userId)
    - Foreign Keys: userId → User.id (CASCADE)
    - **Action**: Remove after Supabase Auth migration

19. **Session** (0 rows) - NextAuth adapter table
    - Columns: id, sessionToken, userId, expires
    - Indexes: Primary key (id), Unique (sessionToken), Index (userId)
    - Foreign Keys: userId → User.id (CASCADE)
    - **Action**: Remove after Supabase Auth migration

20. **VerificationToken** (0 rows) - NextAuth adapter table
    - Columns: identifier, token, expires
    - Indexes: Unique (identifier, token), Unique (token)
    - **Action**: Remove after Supabase Auth migration

### System Tables

21. **_prisma_migrations** - Prisma migration tracking
    - **Action**: Keep for migration history

## Custom Enums (5)

1. **UserRole**: SUPER_ADMIN, COMPANY_ADMIN, SALES_REP, CUSTOMER
2. **ProposalStatus**: DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED
3. **FinanceApplicationStatus**: PENDING, SUBMITTED, APPROVED, DENIED, CONDITIONAL, CANCELLED
4. **SignatureRequestStatus**: DRAFT, SENT, DELIVERED, SIGNED, COMPLETED, DECLINED, VOIDED
5. **PaymentStatus**: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED

## Foreign Key Relationships

All foreign keys use **CASCADE delete** - when parent is deleted, children are automatically deleted.

### User Relationships
- User.companyId → Company.id (CASCADE)
- Account.userId → User.id (CASCADE) - **Remove with NextAuth**
- Session.userId → User.id (CASCADE) - **Remove with NextAuth**

### Proposal Relationships
- Proposal.userId → User.id (CASCADE)
- Proposal.companyId → Company.id (CASCADE)
- ProposalVersion.proposalId → Proposal.id (CASCADE)
- FinanceApplication.proposalId → Proposal.id (CASCADE)
- SignatureRequest.proposalId → Proposal.id (CASCADE)
- Payment.proposalId → Proposal.id (CASCADE)

### Company Configuration Relationships
All company-scoped tables have:
- `tableName.companyId → Company.id (CASCADE)`

Tables: HVACSystem, AddOn, Material, LaborRate, PermitFee, PriceBookUnit, FinancingOption, MaintenancePlan, Incentive

## Indexes Summary

### Primary Keys
- All 21 tables have primary key indexes on `id`

### Unique Constraints
- User.email (unique)
- Account.provider + providerAccountId (composite unique)
- Session.sessionToken (unique)
- VerificationToken.token (unique)
- VerificationToken.identifier + token (composite unique)
- ProposalVersion.proposalId + versionNumber (composite unique)

### Performance Indexes
- **User**: companyId, email
- **Proposal**: userId, companyId, status, createdAt
- **ProposalVersion**: proposalId
- **All company config tables**: companyId
- **PriceBookUnit**: brand + model (composite)
- **FinanceApplication**: proposalId, status, externalApplicationId
- **SignatureRequest**: proposalId, status, envelopeId
- **Payment**: proposalId, status
- **Notification**: userId, companyId, read

## Data Summary

### Current Row Counts
- **User**: 3
- **Company**: 1
- **Proposal**: 4
- **ProposalVersion**: 5
- **HVACSystem**: 3
- **AddOn**: 6
- **PriceBookUnit**: 16
- **LaborRate**: 3
- **PermitFee**: 3
- **Material**: 5
- **FinancingOption**: 5
- **FinanceApplication**: 7
- **MaintenancePlan**: 0
- **Incentive**: 0
- **SignatureRequest**: 0
- **Payment**: 0
- **Notification**: 0
- **Account**: 0 (NextAuth - remove)
- **Session**: 0 (NextAuth - remove)
- **VerificationToken**: 0 (NextAuth - remove)

## Supabase Migration Requirements

### Must Migrate
1. All 21 public schema tables
2. All 5 custom enums
3. All foreign key relationships with CASCADE rules
4. All indexes (primary keys, unique constraints, performance indexes)
5. All data (preserve exact row counts)

### Must Remove After Auth Migration
1. Account table
2. Session table
3. VerificationToken table
4. User.password field (Supabase Auth handles passwords)
5. Foreign keys from Account/Session to User

### Must Add for Supabase Auth
1. User.supabaseUserId (UUID, nullable initially, then required)
2. Index on User.supabaseUserId for lookups

### Neon Auth Schema
- 9 tables in `neon_auth` schema can be ignored
- These are Neon's built-in auth system, not used by the application
