/**
 * Production health check for load balancers and verification.
 * GET /api/health - no auth required.
 * Used by PRODUCTION_VERIFICATION_CHECKLIST.md Step 6.
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, boolean> = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    databaseUrl: Boolean(process.env.DATABASE_URL),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }

  const ok = checks.supabaseUrl && checks.supabaseAnonKey && checks.databaseUrl
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
