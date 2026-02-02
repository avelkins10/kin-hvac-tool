import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Don't add sslmode to the URL — it can override the Pool's ssl config and cause
// "self-signed certificate in certificate chain". SSL is controlled only by the
// Pool's ssl: { rejectUnauthorized: false } below.
function normalizeDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  const isVercel = process.env.VERCEL === '1'
  let u = url.replace(/[?&]sslmode=[^&]+/g, '').replace(/[?&]uselibpqcompat=[^&]+/g, '')
  u = u.replace(/\?&+/, '?').replace(/\?$/, '')
  if (!u) return url
  const sep = u.includes('?') ? '&' : '?'
  if (isVercel && !url.includes('uselibpqcompat')) {
    return `${u}${sep}uselibpqcompat=true`
  }
  return u
}

// Create a connection pool for Prisma 7
// Supabase and pooled Postgres use a cert Node rejects as "self-signed
// certificate in certificate chain". Always allow it when we have a DB URL.
const hasDbUrl = Boolean(process.env.DATABASE_URL)
const pool = hasDbUrl
  ? new Pool({
      connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
      ssl: { rejectUnauthorized: false },
    })
  : null

// Create adapter for Prisma 7
const adapter = pool ? new PrismaPg(pool) : undefined

// When we have an adapter (our Pool with ssl), always create a fresh client so we
// never reuse a cached client that was created without it (causes TLS error in RSC).
const prisma = adapter
  ? new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  : (globalForPrisma.prisma ??
      new PrismaClient({
        adapter: undefined,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      }))

export { prisma }

if (process.env.NODE_ENV !== 'production' && adapter) globalForPrisma.prisma = prisma
