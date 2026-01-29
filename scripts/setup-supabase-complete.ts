#!/usr/bin/env tsx
/**
 * Complete Supabase Setup Script
 *
 * 1. Creates storage buckets (nameplates, proposals, agreements, signed-docs)
 * 2. Runs Prisma migrations on Supabase
 * 3. Verifies buckets and tables
 *
 * Usage: Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DATABASE_URL in .env.local, then:
 *   npx tsx scripts/setup-supabase-complete.ts
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

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required')
  process.exit(1)
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

if (!SUPABASE_DATABASE_URL) {
  console.error('❌ SUPABASE_DATABASE_URL or DATABASE_URL is required (add to .env.local)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createStorageBuckets() {
  console.log('📦 Creating storage buckets...\n')

  const buckets = [
    {
      id: 'nameplates',
      name: 'nameplates',
      public: false,
      file_size_limit: 5242880, // 5 MB
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
    },
    {
      id: 'proposals',
      name: 'proposals',
      public: false,
      file_size_limit: 10485760, // 10 MB
      allowed_mime_types: ['application/pdf']
    },
    {
      id: 'signed-docs',
      name: 'signed-docs',
      public: false,
      file_size_limit: 10485760, // 10 MB
      allowed_mime_types: ['application/pdf']
    },
    {
      id: 'agreements',
      name: 'agreements',
      public: false,
      file_size_limit: 10485760, // 10 MB
      allowed_mime_types: ['application/pdf']
    }
  ]

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.file_size_limit,
        allowedMimeTypes: bucket.allowed_mime_types
      })

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ✅ Bucket "${bucket.id}" already exists`)
        } else {
          console.error(`  ❌ Error creating bucket "${bucket.id}":`, error.message)
        }
      } else {
        console.log(`  ✅ Created bucket "${bucket.id}"`)
      }
    } catch (error: any) {
      console.error(`  ❌ Error creating bucket "${bucket.id}":`, error.message)
    }
  }

  console.log('')
}

async function runPrismaMigrations() {
  console.log('🔄 Running Prisma migrations...\n')

  try {
    process.env.DATABASE_URL = SUPABASE_DATABASE_URL
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('\n✅ Migrations completed successfully!\n')
    return true
  } catch (error) {
    console.error('\n❌ Migration failed\n')
    return false
  }
}

async function verifySetup() {
  console.log('🔍 Verifying setup...\n')

  // Check storage buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.error('  ❌ Error listing buckets:', bucketsError.message)
  } else {
    const requiredBuckets = ['nameplates', 'proposals', 'signed-docs', 'agreements']
    const existingBuckets = buckets?.map(b => b.id) || []
    
    for (const bucketId of requiredBuckets) {
      if (existingBuckets.includes(bucketId)) {
        console.log(`  ✅ Bucket "${bucketId}" exists`)
      } else {
        console.log(`  ❌ Bucket "${bucketId}" missing`)
      }
    }
  }

  // Check database tables (Prisma 7.3 requires adapter)
  try {
    const pool = new Pool({
      connectionString: SUPABASE_DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
    const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('User', 'Company', 'Proposal', 'PriceBookUnit')
      ORDER BY tablename
    `

    console.log('\n  Database tables:')
    if (tables.length > 0) {
      tables.forEach(table => {
        console.log(`    ✅ ${table.tablename}`)
      })
    } else {
      console.log('    ⚠️  No tables found (migrations may not have run)')
    }

    await prisma.$disconnect()
  } catch (error: any) {
    console.error('  ❌ Error checking database:', error.message)
  }

  console.log('')
}

async function main() {
  console.log('🚀 Starting Supabase Setup\n')
  console.log('=' .repeat(50))
  console.log('')

  // Step 1: Create storage buckets
  await createStorageBuckets()

  // Step 2: Run migrations
  const migrationsSuccess = await runPrismaMigrations()

  // Step 3: Verify
  if (migrationsSuccess) {
    await verifySetup()
  }

  console.log('=' .repeat(50))
  console.log('\n✅ Setup complete!')
  console.log('\nNext steps:')
  console.log('1. Set Vercel env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL (Supabase)')
  console.log('2. If migrating from Neon: npm run migrate-db')
  console.log('3. Create first admin: npm run create-admin')
  console.log('4. Test the application')
}

main().catch(console.error)
