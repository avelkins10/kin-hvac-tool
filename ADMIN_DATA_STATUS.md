# Admin Data Status

## Current Situation

**Database Status:** All admin configuration tables are **EMPTY** (0 rows)

- `HVACSystem`: 0 rows
- `AddOn`: 0 rows  
- `PriceBookUnit`: 0 rows
- `LaborRate`: 0 rows
- `PermitFee`: 0 rows
- `MaintenancePlan`: 0 rows
- `Incentive`: 0 rows
- `FinancingOption`: 0 rows

## Why You See Data in the UI

The admin UI is showing **hardcoded default data** from `src/contexts/PriceBookContext.tsx`. 

The `PriceBookContext` has this logic:
```typescript
// If API returns data, use it
// If API returns empty, fall back to defaults
hvacSystems: transformedSystems.length > 0 ? transformedSystems : defaultPriceBook.hvacSystems
```

So you're seeing:
- Default HVAC Systems (Good/Better/Best tiers)
- Default Add-Ons (6 items)
- Default Price Book Units (16 units)
- Default Labor Rates (3 rates)
- Default Permit Fees (3 fees)
- Default Financing Options (11 options)

## What This Means

1. **Viewing works** - You can see all the default data in the admin UI
2. **Editing works** - When you edit and save, it creates new records in the database
3. **New items work** - When you add new items, they save to the database
4. **Defaults persist** - The defaults will keep showing until you have database records

## Solution Options

### Option 1: Seed Database with Defaults (Recommended)
Run a migration script to copy all the default data from `PriceBookContext` into the database. This way:
- All your current "configured" data becomes real database records
- You can then edit/delete them as needed
- New proposals will use database data (not hardcoded defaults)

### Option 2: Keep Using Defaults
- Continue using defaults for now
- Only save custom items you add/edit
- Defaults will always show when database is empty

### Option 3: Clear Defaults
- Remove default data from `PriceBookContext`
- Start with completely empty admin sections
- Build everything from scratch

## Recommendation

**Option 1** - Seed the database with defaults. This preserves your current configuration and makes everything editable.
