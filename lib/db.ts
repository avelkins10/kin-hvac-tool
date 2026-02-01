import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Normalize DATABASE_URL to use verify-full for SSL
function normalizeDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  
  // If it already has sslmode, ensure it's verify-full
  if (url.includes('sslmode=')) {
    return url.replace(/sslmode=[^&]+/, 'sslmode=verify-full')
  }
  
  // If it has no sslmode, add it
  const separator = url.includes('?') ? '&' : '?'
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
