# Admin Settings Database Storage Status

## ✅ Fully Stored in Database

### Company Settings
- **Route**: `/api/company/settings` (PATCH)
- **Stored**: Company name, settings JSON (including pricing settings)
- **Status**: ✅ Working - saves to `Company` table

### HVAC Systems
- **Routes**: `/api/company/hvac-systems` (POST), `/api/company/hvac-systems/[id]` (PATCH, DELETE)
- **Stored**: Name, tier, baseCost, marginType, marginAmount
- **Status**: ✅ Working - saves to `HVACSystem` table

### Add-Ons
- **Routes**: `/api/company/addons` (POST), `/api/company/addons/[id]` (PATCH, DELETE)
- **Stored**: Name, baseCost, marginType, marginAmount
- **Status**: ✅ Working - saves to `AddOn` table

### Maintenance Plans
- **Routes**: `/api/company/maintenance-plans` (POST), `/api/company/maintenance-plans/[id]` (PATCH, DELETE)
- **Stored**: Name, tier, baseCost, marginType, marginAmount
- **Status**: ✅ Working - saves to `MaintenancePlan` table

### Incentives
- **Routes**: `/api/company/incentives` (POST), `/api/company/incentives/[id]` (PATCH, DELETE)
- **Stored**: Name, amount, type, description
- **Status**: ✅ Working - saves to `Incentive` table

### Financing Options
- **Routes**: `/api/company/financing-options` (POST), `/api/company/financing-options/[id]` (PATCH, DELETE)
- **Stored**: Name, type, terms (JSON), apr
- **Status**: ✅ Working - saves to `FinancingOption` table

### Price Book - Units
- **Routes**: `/api/company/pricebook` (POST), `/api/company/pricebook/[id]` (PATCH, DELETE)
- **Stored**: Brand, model, tonnage, tier, baseCost
- **Status**: ✅ **FIXED** - Now saves to `PriceBookUnit` table (was only updating local state before)

### Price Book - Labor Rates
- **Routes**: `/api/company/labor-rates` (POST), `/api/company/labor-rates/[id]` (PATCH, DELETE)
- **Stored**: Name, rate
- **Status**: ✅ Working - saves to `LaborRate` table

### Price Book - Permit Fees
- **Routes**: `/api/company/permits` (POST), `/api/company/permits/[id]` (PATCH, DELETE)
- **Stored**: Name, cost
- **Status**: ✅ Working - saves to `PermitFee` table

### Price Book - Materials
- **Routes**: `/api/company/materials` (POST), `/api/company/materials/[id]` (PATCH, DELETE)
- **Stored**: Name, cost, unit
- **Status**: ✅ Working - saves to `Material` table

## Settings (Pricing Configuration)

### Margin Visibility & Cash Markup
- **Route**: `/api/company/settings` (PATCH)
- **Stored**: In `Company.settings.pricing` JSON field
- **Status**: ✅ Working - `updateSettings()` function saves to database

## Summary

**All admin settings are now properly stored in the database!**

### Recent Fixes:
1. ✅ **Units** - Fixed to save via API instead of only local state
2. ✅ **All Price Book items** - Now use API calls directly, then refresh context
3. ✅ **Delete buttons** - All properly call DELETE API endpoints

### Data Flow:
1. User makes change in admin UI
2. Component makes API call (POST/PATCH/DELETE)
3. API saves to database via Prisma
4. Component refreshes context to get latest data
5. UI updates with fresh data from database

All operations are now properly persisted! 🎉
