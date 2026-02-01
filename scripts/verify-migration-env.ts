/**
 * Verify environment variables required for Supabase migration.
 * Loads .env.local and checks DATABASE_URL, SUPABASE_DATABASE_URL, and optional Supabase API keys.
 *
 * Usage: npm run verify-migration-env   or   npx tsx scripts/verify-migration-env.ts
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

const DATABASE_URL = process.env.DATABASE_URL
const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let ok = true

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set')
  ok = false
} else {
  console.log('✅ DATABASE_URL is set')
}

if (!SUPABASE_DATABASE_URL) {
  console.error('❌ SUPABASE_DATABASE_URL not set')
  ok = false
} else {
  console.log('✅ SUPABASE_DATABASE_URL is set')
}

if (!NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL not set (needed for app and create-admin)')
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL is set')
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set (needed for create-admin and storage)')
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY is set')
}

if (!ok) {
  console.error('\nSet missing variables in .env.local. See SUPABASE_MIGRATION_EXECUTION_GUIDE.md Step 3.')
  process.exit(1)
}

console.log('\n✅ All required migration env vars are set.')
console.log('   For migration: DATABASE_URL = Neon (source), SUPABASE_DATABASE_URL = Supabase (target).')
console.log('   Then run: npm run migrate-db')
