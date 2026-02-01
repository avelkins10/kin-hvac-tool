/**
 * Production health check for load balancers and verification.
 * GET /api/health - no auth required.
 * Checks env vars and optionally pings the database to verify connection.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, boolean> = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    databaseUrl: Boolean(process.env.DATABASE_URL),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }

  let databaseConnected = false
  if (checks.databaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`
      databaseConnected = true
    } catch (e) {
      checks.databaseConnected = false
    }
  }
  checks.databaseConnected = databaseConnected

  const ok =
    checks.supabaseUrl &&
    checks.supabaseAnonKey &&
    checks.databaseUrl &&
    checks.databaseConnected
  const status = ok ? 200 : 503

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  )
}
