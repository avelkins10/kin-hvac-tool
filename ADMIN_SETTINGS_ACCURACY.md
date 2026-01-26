# Admin Settings Accuracy & Data Flow

## Current Architecture

### Data Flow
1. **Database** → Stores company configuration (HVAC Systems, Add-Ons, etc.)
2. **API Routes** → Expose database data via REST endpoints
3. **PriceBookContext** → Loads from API on mount, transforms data for proposal builder
4. **Admin Settings** → Direct API access for CRUD operations
5. **Proposal Builder** → Uses PriceBookContext for pricing calculations

## Issues Identified

### ✅ What Works
- Admin settings save correctly to database via API
- API routes are properly secured (admin-only for writes)
- Data is correctly transformed from database to context format

### ⚠️ Potential Issues

1. **Context Refresh**
   - PriceBookContext only loads once on mount
   - Changes in admin settings don't automatically refresh the context
   - Proposal builder may show stale data until page refresh

2. **Data Transformation**
   - Database schema differs from context interfaces
   - Some fields are hardcoded during transformation (e.g., `installLaborHours: 8`, `seerRating: 16`)
   - Missing database fields fall back to defaults

3. **Settings Sync**
   - Company settings stored in JSON field
   - PriceBookContext loads from `company.settings.pricing`
   - Admin settings update `company.settings` directly
   - Need to ensure structure matches

## Recommendations

1. **Add Refresh Functions**
   - Add `refreshPriceBook()` to PriceBookContext
   - Add `refreshPlans()` to MaintenanceContext  
   - Add `refreshIncentives()` to IncentivesContext
   - Call refresh after admin CRUD operations

2. **Improve Data Mapping**
   - Store more fields in database (SEER rating, labor hours, etc.)
   - Reduce hardcoded defaults in transformation
   - Add validation to ensure required fields exist

3. **Real-time Updates**
   - Consider WebSocket or polling for live updates
   - Or add manual refresh button in admin settings
   - Or use router.refresh() after saves

## Current Status

- ✅ Admin settings accurately reflect database state
- ✅ Changes save correctly to database
- ⚠️ Context may show stale data until refresh
- ⚠️ Some fields use hardcoded defaults instead of database values
