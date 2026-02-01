import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// On Vercel, use libpq-compat sslmode=require (SSL, no cert verification) so
// Supabase pooler works despite "self-signed certificate in certificate chain".
// See: pg-connection-string treats require as verify-full unless uselibpqcompat=true
function normalizeDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined

  const isVercel = process.env.VERCEL === '1'
  const separator = url.includes('?') ? '&' : '?'

  if (isVercel) {
    // Strip existing sslmode/params so we can add libpq-compat params
    let u = url.replace(/[?&]sslmode=[^&]+/g, '').replace(/[?&]uselibpqcompat=[^&]+/g, '')
    u = u.replace(/\?&+/, '?').replace(/\?$/, '')
    const sep = u.includes('?') ? '&' : '?'
    return `${u}${sep}uselibpqcompat=true&sslmode=require`
  }

  if (url.includes('sslmode=')) {
    return url.replace(/sslmode=[^&]+/, 'sslmode=verify-full')
  }
  return `${url}${separator}sslmode=verify-full`
}

// Create a connection pool for Prisma 7
// On Vercel, TLS often fails with "self-signed certificate in certificate chain"
// unless we allow the Supabase pooler cert (rejectUnauthorized: false).
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
      ssl:
        process.env.VERCEL === '1'
          ? { rejectUnauthorized: false }
          : undefined,
    })
  : null

// Create adapter for Prisma 7
const adapter = pool ? new PrismaPg(pool) : undefined

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: adapter || undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
