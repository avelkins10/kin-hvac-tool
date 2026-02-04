/**
 * API route to get current user data (role, companyId)
 * Called from client components to get User record after Supabase Auth login
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser as getSupabaseUser } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

const selectWithLightReach = {
  id: true,
  email: true,
  role: true,
  companyId: true,
  lightreachSalesRepName: true,
  lightreachSalesRepEmail: true,
  lightreachSalesRepPhone: true,
} as const

const selectBase = {
  id: true,
  email: true,
  role: true,
  companyId: true,
} as const

export async function GET(request: NextRequest) {
  try {
    const supabaseUser = await getSupabaseUser()
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user: {
      id: string
      email: string
      role: string
      companyId: string | null
      lightreachSalesRepName?: string | null
      lightreachSalesRepEmail?: string | null
      lightreachSalesRepPhone?: string | null
    } | null

    try {
      user = await prisma.user.findUnique({
        where: { supabaseUserId: supabaseUser.id },
        select: selectWithLightReach,
      })
    } catch (prismaErr: unknown) {
      const code = prismaErr && typeof prismaErr === 'object' && 'code' in prismaErr
        ? (prismaErr as { code: string }).code
        : ''
      // P2022 = column does not exist (e.g. migration not applied); fall back to base fields only
      if (code === 'P2022' || code === 'P2010') {
        user = await prisma.user.findUnique({
          where: { supabaseUserId: supabaseUser.id },
          select: selectBase,
        }) as typeof user
      } else {
        throw prismaErr
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      lightreachSalesRepName: user.lightreachSalesRepName ?? undefined,
      lightreachSalesRepEmail: user.lightreachSalesRepEmail ?? undefined,
      lightreachSalesRepPhone: user.lightreachSalesRepPhone ?? undefined,
    })
  } catch (error) {
    console.error('[GET /api/auth/user] Error:', error)
    // Missing Supabase env, DB error, or transient failure → return 401 so client shows "not logged in" instead of 500
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
