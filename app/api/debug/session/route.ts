/**
 * GET /api/debug/session
 * Returns what the server sees: cookie count, Supabase user, DB User.
 * Call with same cookies as after login (e.g. from signed-in debug page).
 */
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result: {
    cookieCount: number
    supabaseUser: { id: string; email: string | undefined } | null
    dbUser: { id: string; email: string } | null
    error?: string
  } = {
    cookieCount: 0,
    supabaseUser: null,
    dbUser: null,
  }

  try {
    const cookieStore = await cookies()
    result.cookieCount = cookieStore.getAll().length

    const supabaseUser = await getCurrentUser()
    if (supabaseUser) {
      result.supabaseUser = {
        id: supabaseUser.id,
        email: supabaseUser.email ?? undefined,
      }
      const dbUser = await prisma.user.findUnique({
        where: { supabaseUserId: supabaseUser.id },
        select: { id: true, email: true },
      })
      if (dbUser) {
        result.dbUser = { id: dbUser.id, email: dbUser.email }
      }
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err)
    return NextResponse.json(result, { status: 200 })
  }
}
