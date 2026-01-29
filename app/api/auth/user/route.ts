/**
 * API route to get current user data (role, companyId)
 * Called from client components to get User record after Supabase Auth login
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser as getSupabaseUser } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const supabaseUser = await getSupabaseUser()
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get User record from database
    const user = await prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
