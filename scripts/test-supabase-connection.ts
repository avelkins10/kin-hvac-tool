/**
 * Test Supabase database connection using SUPABASE_DATABASE_URL from .env.local.
 * Resolves host to IPv4 to avoid EHOSTUNREACH when IPv6 is unreachable.
 * Usage: npm run test-supabase-connection
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { promises as dns } from 'dns'
import { Pool } from 'pg'

const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m) {
      const val = m[2].replace(/^["']|["']$/g, '').trim()
      if (val && !val.startsWith('#')) process.env[m[1]] = val
    }
  }
}

const url = process.env.SUPABASE_DATABASE_URL
if (!url) {
  console.error('❌ SUPABASE_DATABASE_URL not set in .env.local')
  process.exit(1)
}

async function run() {
  const parsed = new URL(url)
  let connectionString = url
  try {
    const [ipv4] = await dns.resolve4(parsed.hostname)
    if (ipv4) {
      parsed.hostname = ipv4
      connectionString = parsed.toString()
    }
  } catch {
    // keep original URL if resolve4 fails
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await pool.query('SELECT 1')
    console.log('✅ Supabase connection successful!')
  } catch (err) {
    console.error('❌ Connection failed:', (err as Error).message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

run()
