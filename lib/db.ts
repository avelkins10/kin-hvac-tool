import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// On Vercel, use sslmode=require (no cert verification) to avoid
// "self-signed certificate in certificate chain" with Supabase pooler.
const sslMode = process.env.VERCEL === '1' ? 'require' : 'verify-full'

function normalizeDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined

  if (url.includes('sslmode=')) {
    return url.replace(/sslmode=[^&]+/, `sslmode=${sslMode}`)
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}sslmode=${sslMode}`
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
