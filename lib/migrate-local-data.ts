// Utility to migrate data from localStorage to database
// This will be used by the admin portal to import existing data

import { prisma } from './db'

interface LocalStorageData {
  priceBook?: any
  maintenancePlans?: any
  incentives?: any
  proposals?: any[]
}

export async function migrateLocalStorageData(
  companyId: string,
  data: LocalStorageData
): Promise<{ success: boolean; message: string; counts?: any }> {
  try {
    const counts = {
      priceBookUnits: 0,
      maintenancePlans: 0,
      incentives: 0,
      proposals: 0,
    }

    // Migrate pricebook
    if (data.priceBook && Array.isArray(data.priceBook)) {
      for (const unit of data.priceBook) {
        try {
          await prisma.priceBookUnit.create({
            data: {
              companyId,
              brand: unit.brand || '',
              model: unit.model || '',
              tonnage: unit.tonnage || null,
              tier: unit.tier || null,
              baseCost: unit.baseCost || 0,
            },
          })
          counts.priceBookUnits++
        } catch (error) {
          console.error('Error migrating pricebook unit:', error)
        }
      }
    }

    // Migrate maintenance plans
    if (data.maintenancePlans && Array.isArray(data.maintenancePlans)) {
      for (const plan of data.maintenancePlans) {
        try {
          await prisma.maintenancePlan.create({
            data: {
              companyId,
              name: plan.name || '',
              tier: plan.tier || null,
              baseCost: plan.baseCost || 0,
              marginType: plan.marginType || null,
              marginAmount: plan.marginAmount || null,
            },
          })
          counts.maintenancePlans++
        } catch (error) {
          console.error('Error migrating maintenance plan:', error)
        }
      }
    }

    // Migrate incentives
    if (data.incentives && Array.isArray(data.incentives)) {
      for (const incentive of data.incentives) {
        try {
          await prisma.incentive.create({
            data: {
              companyId,
              name: incentive.name || '',
              amount: incentive.amount || 0,
              type: incentive.type || null,
              description: incentive.description || null,
            },
          })
          counts.incentives++
        } catch (error) {
          console.error('Error migrating incentive:', error)
        }
      }
    }

    return {
      success: true,
      message: 'Migration completed successfully',
      counts,
    }
  } catch (error) {
    console.error('Migration error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Migration failed',
    }
  }
}
