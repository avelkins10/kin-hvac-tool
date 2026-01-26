/**
 * Seed Admin Defaults Script
 * 
 * This script copies all default data from PriceBookContext into the database.
 * Run this once to populate your database with the default configuration.
 * 
 * Usage:
 *   npx tsx scripts/seed-admin-defaults.ts
 * 
 * Or with ts-node:
 *   ts-node scripts/seed-admin-defaults.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const COMPANY_ID = 'company-kinhome' // Your company ID from the database

async function seedDefaults() {
  console.log('🌱 Seeding admin defaults into database...\n')

  try {
    // 1. Seed HVAC Systems
    console.log('📦 Seeding HVAC Systems...')
    const defaultHVACSystems = [
      { name: 'Good Tier System', tier: 'good', baseCost: 2400, marginType: 'percentage', marginAmount: 30 },
      { name: 'Better Tier System', tier: 'better', baseCost: 3200, marginType: 'percentage', marginAmount: 35 },
      { name: 'Best Tier System', tier: 'best', baseCost: 4800, marginType: 'percentage', marginAmount: 40 },
    ]

    for (const system of defaultHVACSystems) {
      // Check if exists first (no unique constraint on name+companyId)
      const existing = await prisma.hVACSystem.findFirst({
        where: {
          companyId: COMPANY_ID,
          name: system.name,
        },
      })
      
      if (!existing) {
        await prisma.hVACSystem.create({
          data: {
            companyId: COMPANY_ID,
            ...system,
          },
        })
      }
    }
    console.log(`   ✅ Created ${defaultHVACSystems.length} HVAC Systems\n`)

    // 2. Seed Add-Ons
    console.log('📦 Seeding Add-Ons...')
    const defaultAddOns = [
      { name: 'UV Light Air Purifier', baseCost: 500, marginType: 'fixed', marginAmount: 350 },
      { name: 'HEPA Filtration System', baseCost: 400, marginType: 'fixed', marginAmount: 250 },
      { name: 'Extended Warranty (10yr)', baseCost: 800, marginType: 'fixed', marginAmount: 400 },
      { name: 'Premium Smart Thermostat', baseCost: 250, marginType: 'fixed', marginAmount: 200 },
      { name: 'Duct Sealing Package', baseCost: 600, marginType: 'fixed', marginAmount: 300 },
      { name: 'Surge Protector', baseCost: 150, marginType: 'fixed', marginAmount: 100 },
    ]

    for (const addon of defaultAddOns) {
      const existing = await prisma.addOn.findFirst({
        where: {
          companyId: COMPANY_ID,
          name: addon.name,
        },
      })
      
      if (!existing) {
        await prisma.addOn.create({
          data: {
            companyId: COMPANY_ID,
            ...addon,
          },
        })
      }
    }
    console.log(`   ✅ Created ${defaultAddOns.length} Add-Ons\n`)

    // 3. Seed Price Book Units
    console.log('📦 Seeding Price Book Units...')
    const defaultUnits = [
      { brand: 'Goodman', model: 'GSX160241', tonnage: 2, tier: 'good', baseCost: 2400 },
      { brand: 'Goodman', model: 'GSX170241', tonnage: 2, tier: 'better', baseCost: 3200 },
      { brand: 'Daikin', model: 'DX18TC0241A', tonnage: 2, tier: 'better', baseCost: 3800 },
      { brand: 'Daikin', model: 'DX20VC0241A', tonnage: 2, tier: 'best', baseCost: 5200 },
      { brand: 'Goodman', model: 'GSX160361', tonnage: 3, tier: 'good', baseCost: 2800 },
      { brand: 'Goodman', model: 'GSX170361', tonnage: 3, tier: 'better', baseCost: 3600 },
      { brand: 'Daikin', model: 'DX18TC0361A', tonnage: 3, tier: 'better', baseCost: 4200 },
      { brand: 'Daikin', model: 'DX20VC0361A', tonnage: 3, tier: 'best', baseCost: 5800 },
      { brand: 'Goodman', model: 'GSX160481', tonnage: 4, tier: 'good', baseCost: 3200 },
      { brand: 'Goodman', model: 'GSX170481', tonnage: 4, tier: 'better', baseCost: 4000 },
      { brand: 'Daikin', model: 'DX18TC0481A', tonnage: 4, tier: 'better', baseCost: 4800 },
      { brand: 'Daikin', model: 'DX20VC0481A', tonnage: 4, tier: 'best', baseCost: 6400 },
      { brand: 'Goodman', model: 'GSX160601', tonnage: 5, tier: 'good', baseCost: 3600 },
      { brand: 'Goodman', model: 'GSX170601', tonnage: 5, tier: 'better', baseCost: 4400 },
      { brand: 'Daikin', model: 'DX18TC0601A', tonnage: 5, tier: 'better', baseCost: 5400 },
      { brand: 'Daikin', model: 'DX20VC0601A', tonnage: 5, tier: 'best', baseCost: 7200 },
    ]

    for (const unit of defaultUnits) {
      const existing = await prisma.priceBookUnit.findFirst({
        where: {
          companyId: COMPANY_ID,
          brand: unit.brand,
          model: unit.model,
        },
      })
      
      if (!existing) {
        await prisma.priceBookUnit.create({
          data: {
            companyId: COMPANY_ID,
            ...unit,
          },
        })
      }
    }
    console.log(`   ✅ Created ${defaultUnits.length} Price Book Units\n`)

    // 4. Seed Labor Rates
    console.log('📦 Seeding Labor Rates...')
    const defaultLaborRates = [
      { name: 'Standard Crew Rate', rate: 150 },
      { name: 'Premium Crew Rate', rate: 200 },
      { name: 'Apprentice Rate', rate: 75 },
    ]

    for (const rate of defaultLaborRates) {
      const existing = await prisma.laborRate.findFirst({
        where: {
          companyId: COMPANY_ID,
          name: rate.name,
        },
      })
      
      if (!existing) {
        await prisma.laborRate.create({
          data: {
            companyId: COMPANY_ID,
            ...rate,
          },
        })
      }
    }
    console.log(`   ✅ Created ${defaultLaborRates.length} Labor Rates\n`)

    // 5. Seed Permit Fees
    console.log('📦 Seeding Permit Fees...')
    const defaultPermitFees = [
      { name: 'Small System', cost: 200 },
      { name: 'Medium System', cost: 225 },
      { name: 'Large System', cost: 275 },
    ]

    for (const permit of defaultPermitFees) {
      const existing = await prisma.permitFee.findFirst({
        where: {
          companyId: COMPANY_ID,
          name: permit.name,
        },
      })
      
      if (!existing) {
        await prisma.permitFee.create({
          data: {
            companyId: COMPANY_ID,
            ...permit,
          },
        })
      }
    }
    console.log(`   ✅ Created ${defaultPermitFees.length} Permit Fees\n`)

    // 6. Seed Materials
    console.log('📦 Seeding Materials...')
    const defaultMaterials = [
      { name: 'R-410A Refrigerant', cost: 12, unit: 'lb' },
      { name: '25ft Line Set', cost: 120, unit: 'each' },
      { name: 'Disconnect Box', cost: 45, unit: 'each' },
      { name: 'Thermostat Wire', cost: 1.5, unit: 'ft' },
      { name: 'Condenser Pad', cost: 75, unit: 'each' },
    ]

    for (const material of defaultMaterials) {
      const existing = await prisma.material.findFirst({
        where: {
          companyId: COMPANY_ID,
          name: material.name,
        },
      })
      
      if (!existing) {
        await prisma.material.create({
          data: {
            companyId: COMPANY_ID,
            ...material,
          },
        })
      }
    }
    console.log(`   ✅ Created ${defaultMaterials.length} Materials\n`)

    // 7. Seed Financing Options (non-Lightreach ones)
    console.log('📦 Seeding Financing Options...')
    const defaultFinancing = [
      { name: 'Cash Payment', type: 'cash', apr: 0, terms: { description: 'Pay in full - receive 5% discount' } },
      { name: 'Same-As-Cash 12 Months', type: 'finance', apr: 0, terms: { termMonths: 12, dealerFee: 5, provider: 'GreenSky' } },
      { name: '60 Month Financing', type: 'finance', apr: 9.99, terms: { termMonths: 60, dealerFee: 8, provider: 'GreenSky' } },
      { name: '84 Month Financing', type: 'finance', apr: 11.99, terms: { termMonths: 84, dealerFee: 10, provider: 'GreenSky' } },
      { name: '120 Month Financing', type: 'finance', apr: 12.99, terms: { termMonths: 120, dealerFee: 12, provider: 'GreenSky' } },
    ]

    for (const financing of defaultFinancing) {
      const existing = await prisma.financingOption.findFirst({
        where: {
          companyId: COMPANY_ID,
          name: financing.name,
        },
      })
      
      if (!existing) {
        await prisma.financingOption.create({
          data: {
            companyId: COMPANY_ID,
            name: financing.name,
            type: financing.type,
            apr: financing.apr,
            terms: financing.terms as any,
          },
        })
      }
    }
    console.log(`   ✅ Created ${defaultFinancing.length} Financing Options\n`)

    console.log('✨ Seeding complete! All defaults are now in the database.\n')
    console.log('💡 Note: Lightreach lease options are handled separately in the code.')
    console.log('💡 Note: Maintenance Plans and Incentives need to be added manually via the admin UI.\n')

  } catch (error) {
    console.error('❌ Error seeding defaults:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedDefaults()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
