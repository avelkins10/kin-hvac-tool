/**
 * Migrate Database from Neon to Supabase
 *
 * Usage:
 *   1. In .env.local set DATABASE_URL (Neon source) and SUPABASE_DATABASE_URL (Supabase target).
 *   2. Run: npm run migrate-db   or   npx tsx scripts/migrate-to-supabase.ts
 *   Or: DATABASE_URL=... SUPABASE_DATABASE_URL=... npx tsx scripts/migrate-to-supabase.ts
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) {
      const val = m[2].replace(/^["']|["']$/g, '').trim()
      process.env[m[1]] = val
    }
  }
}

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { execSync } from 'child_process'

// Supabase: use Transaction pooler → SHARED POOLER (IPv4 compatible, works from Vercel)
// Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres
// Set SUPABASE_DATABASE_URL in .env.local. If password contains @, encode as %40.
const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL

const NEON_DATABASE_URL = process.env.DATABASE_URL

if (!NEON_DATABASE_URL) {
  console.error('❌ DATABASE_URL (Neon) not found in environment')
  process.exit(1)
}
if (!SUPABASE_DATABASE_URL) {
  console.error('❌ SUPABASE_DATABASE_URL not found in .env.local.')
  console.error('   Supabase Dashboard → Project Settings → Database → Connection string → Transaction pooler (port 6543).')
  console.error('   Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST].pooler.supabase.com:6543/postgres')
  process.exit(1)
}

const SKIP_MIGRATE_DEPLOY = process.env.SKIP_MIGRATE_DEPLOY === 'true' || process.env.SKIP_MIGRATE_DEPLOY === '1'

async function migrate() {
  console.log('🔄 Starting migration from Neon to Supabase...\n')

  // Step 1: Run Prisma migrations on Supabase (skip if schema already applied: SKIP_MIGRATE_DEPLOY=1)
  if (!SKIP_MIGRATE_DEPLOY) {
    console.log('📦 Step 1: Running Prisma migrations on Supabase...')
    try {
      process.env.DATABASE_URL = SUPABASE_DATABASE_URL
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      console.log('✅ Schema migrated\n')
    } catch (error) {
      console.error('❌ Failed to run migrations:', error)
      console.error('   If schema is already applied on Supabase, run: SKIP_MIGRATE_DEPLOY=1 npm run migrate-db')
      process.exit(1)
    }
  } else {
    console.log('📦 Step 1: Skipping Prisma migrate deploy (SKIP_MIGRATE_DEPLOY=1)\n')
  }

  // Step 2: Create Prisma clients for both databases (Prisma 7.3 requires adapter per client)
  console.log('📦 Step 2: Connecting to databases...')
  // Supabase pooler TLS: skip cert verification to avoid "self-signed certificate in certificate chain"
  const supabaseUrlRaw = SUPABASE_DATABASE_URL.replace(/\?.*$/, '')
  const neonPool = new Pool({ connectionString: NEON_DATABASE_URL })
  const supabasePool = new Pool({
    connectionString: supabaseUrlRaw,
    ssl: { rejectUnauthorized: false },
  })
  const neonPrisma = new PrismaClient({ adapter: new PrismaPg(neonPool) })
  let supabasePrisma: PrismaClient
  try {
    supabasePrisma = new PrismaClient({ adapter: new PrismaPg(supabasePool) })
    await supabasePrisma.$queryRaw`SELECT 1`
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Authentication failed') || msg.includes('credentials') || (err as { code?: string })?.code === 'P1000') {
      console.error('\n❌ Supabase authentication failed. Fix SUPABASE_DATABASE_URL in .env.local:')
      console.error('   1. Supabase Dashboard → Project Settings → Database')
      console.error('   2. Under "Connection string", choose Transaction pooler → SHARED POOLER (or Session pooler)')
      console.error('   3. Copy the URI and replace [YOUR-PASSWORD] with your database password')
      console.error('   4. If Transaction pooler (port 6543) fails, try Session pooler (port 5432)')
      console.error('   5. Password = the one you set in Database Settings (reset if unsure)\n')
    }
    throw err
  }

  try {
    // Step 3: Migrate data table by table
    console.log('📦 Step 3: Migrating data...\n')

    // Company
    console.log('  Migrating Company...')
    const companies = await neonPrisma.company.findMany()
    for (const company of companies) {
      await supabasePrisma.company.upsert({
        where: { id: company.id },
        update: company,
        create: company,
      })
    }
    console.log(`    ✅ Migrated ${companies.length} companies`)

    // User
    console.log('  Migrating User...')
    const users = await neonPrisma.user.findMany()
    for (const user of users) {
      await supabasePrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      })
    }
    console.log(`    ✅ Migrated ${users.length} users`)

    // HVACSystem
    console.log('  Migrating HVACSystem...')
    const systems = await neonPrisma.hVACSystem.findMany()
    for (const system of systems) {
      await supabasePrisma.hVACSystem.upsert({
        where: { id: system.id },
        update: system,
        create: system,
      })
    }
    console.log(`    ✅ Migrated ${systems.length} HVAC systems`)

    // AddOn
    console.log('  Migrating AddOn...')
    const addons = await neonPrisma.addOn.findMany()
    for (const addon of addons) {
      await supabasePrisma.addOn.upsert({
        where: { id: addon.id },
        update: addon,
        create: addon,
      })
    }
    console.log(`    ✅ Migrated ${addons.length} add-ons`)

    // PriceBookUnit
    console.log('  Migrating PriceBookUnit...')
    const units = await neonPrisma.priceBookUnit.findMany()
    for (const unit of units) {
      await supabasePrisma.priceBookUnit.upsert({
        where: { id: unit.id },
        update: unit,
        create: unit,
      })
    }
    console.log(`    ✅ Migrated ${units.length} price book units`)

    // LaborRate
    console.log('  Migrating LaborRate...')
    const rates = await neonPrisma.laborRate.findMany()
    for (const rate of rates) {
      await supabasePrisma.laborRate.upsert({
        where: { id: rate.id },
        update: rate,
        create: rate,
      })
    }
    console.log(`    ✅ Migrated ${rates.length} labor rates`)

    // PermitFee
    console.log('  Migrating PermitFee...')
    const permits = await neonPrisma.permitFee.findMany()
    for (const permit of permits) {
      await supabasePrisma.permitFee.upsert({
        where: { id: permit.id },
        update: permit,
        create: permit,
      })
    }
    console.log(`    ✅ Migrated ${permits.length} permit fees`)

    // Material
    console.log('  Migrating Material...')
    const materials = await neonPrisma.material.findMany()
    for (const material of materials) {
      await supabasePrisma.material.upsert({
        where: { id: material.id },
        update: material,
        create: material,
      })
    }
    console.log(`    ✅ Migrated ${materials.length} materials`)

    // FinancingOption
    console.log('  Migrating FinancingOption...')
    const financing = await neonPrisma.financingOption.findMany()
    for (const option of financing) {
      await supabasePrisma.financingOption.upsert({
        where: { id: option.id },
        update: option,
        create: option,
      })
    }
    console.log(`    ✅ Migrated ${financing.length} financing options`)

    // MaintenancePlan
    console.log('  Migrating MaintenancePlan...')
    const plans = await neonPrisma.maintenancePlan.findMany()
    for (const plan of plans) {
      await supabasePrisma.maintenancePlan.upsert({
        where: { id: plan.id },
        update: plan,
        create: plan,
      })
    }
    console.log(`    ✅ Migrated ${plans.length} maintenance plans`)

    // Incentive
    console.log('  Migrating Incentive...')
    const incentives = await neonPrisma.incentive.findMany()
    for (const incentive of incentives) {
      await supabasePrisma.incentive.upsert({
        where: { id: incentive.id },
        update: incentive,
        create: incentive,
      })
    }
    console.log(`    ✅ Migrated ${incentives.length} incentives`)

    // Proposal
    console.log('  Migrating Proposal...')
    const proposals = await neonPrisma.proposal.findMany()
    for (const proposal of proposals) {
      await supabasePrisma.proposal.upsert({
        where: { id: proposal.id },
        update: proposal,
        create: proposal,
      })
    }
    console.log(`    ✅ Migrated ${proposals.length} proposals`)

    // ProposalVersion
    console.log('  Migrating ProposalVersion...')
    const versions = await neonPrisma.proposalVersion.findMany()
    for (const version of versions) {
      await supabasePrisma.proposalVersion.upsert({
        where: { 
          proposalId_versionNumber: {
            proposalId: version.proposalId,
            versionNumber: version.versionNumber,
          }
        },
        update: version,
        create: version,
      })
    }
    console.log(`    ✅ Migrated ${versions.length} proposal versions`)

    // FinanceApplication
    console.log('  Migrating FinanceApplication...')
    const financeApps = await neonPrisma.financeApplication.findMany()
    for (const app of financeApps) {
      await supabasePrisma.financeApplication.upsert({
        where: { id: app.id },
        update: app,
        create: app,
      })
    }
    console.log(`    ✅ Migrated ${financeApps.length} finance applications`)

    // SignatureRequest
    console.log('  Migrating SignatureRequest...')
    const signatures = await neonPrisma.signatureRequest.findMany()
    for (const sig of signatures) {
      await supabasePrisma.signatureRequest.upsert({
        where: { id: sig.id },
        update: sig,
        create: sig,
      })
    }
    console.log(`    ✅ Migrated ${signatures.length} signature requests`)

    // Payment
    console.log('  Migrating Payment...')
    const payments = await neonPrisma.payment.findMany()
    for (const payment of payments) {
      await supabasePrisma.payment.upsert({
        where: { id: payment.id },
        update: payment,
        create: payment,
      })
    }
    console.log(`    ✅ Migrated ${payments.length} payments`)

    // Notification
    console.log('  Migrating Notification...')
    const notifications = await neonPrisma.notification.findMany()
    for (const notification of notifications) {
      await supabasePrisma.notification.upsert({
        where: { id: notification.id },
        update: notification,
        create: notification,
      })
    }
    console.log(`    ✅ Migrated ${notifications.length} notifications`)

    console.log('\n✨ Migration complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Set up storage buckets (run scripts/setup-supabase-storage.sql in Supabase SQL Editor)')
    console.log('   2. Get API keys from Supabase dashboard')
    console.log('   3. Update Vercel environment variables')
    console.log('   4. Test the application')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await neonPrisma.$disconnect()
    await supabasePrisma.$disconnect()
  }
}

migrate()
