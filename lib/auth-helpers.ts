import { getCurrentUser as getSupabaseUser } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SALES_REP' | 'CUSTOMER'

/**
 * Session-like object for compatibility with existing code
 */
export interface Session {
  user: {
    id: string
    email: string
    role: UserRole
    companyId: string | null
  }
}

/**
 * Require authentication - redirects to signin if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const supabaseUser = await getSupabaseUser()
  if (!supabaseUser) {
    redirect('/auth/signin')
  }

  try {
    // Get User record f rom database to get role and companyId
    let user = await prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
      },
    })

    // Auto-provision: Supabase user exists but no User row (e.g. first login or user created in Auth only)
    if (!user) {
      const email = supabaseUser.email ?? `${supabaseUser.id}@supabase.user`
      try {
        user = await prisma.user.create({
          data: {
            email,
            supabaseUserId: supabaseUser.id,
            role: 'SALES_REP',
          },
          select: {
            id: true,
            email: true,
            role: true,
            companyId: true,
          },
        })
      } catch (createErr: unknown) {
        const code = createErr && typeof createErr === 'object' && 'code' in createErr ? (createErr as { code: string }).code : ''
        if (code === 'P2002') {
          // Email already exists (e.g. user created via script); link this Supabase user if row has no link yet
          await prisma.user.updateMany({
            where: { email, supabaseUserId: null },
            data: { supabaseUserId: supabaseUser.id },
          })
          user = await prisma.user.findUnique({
            where: { supabaseUserId: supabaseUser.id },
            select: { id: true, email: true, role: true, companyId: true },
          })
        }
        if (!user) redirect('/auth/signin')
      }
    }

    if (!user) {
      redirect('/auth/signin')
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        companyId: user.companyId,
      },
    }
  } catch (err) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'Missing DATABASE_URL. Set it in Vercel → Project → Settings → Environment Variables (use your Supabase pooler connection string).'
      )
    }
    throw err
  }
}

/**
 * Require specific role(s) - redirects to unauthorized if role doesn't match
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<Session> {
  const session = await requireAuth()
  const userRole = session.user.role
  
  if (!allowedRoles.includes(userRole)) {
    redirect('/unauthorized')
  }
  return session
}

/**
 * Get current user (returns null if not authenticated)
 */
export async function getCurrentUser() {
  const supabaseUser = await getSupabaseUser()
  if (!supabaseUser) {
    return null
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
    return null
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    companyId: user.companyId,
  }
}

/**
 * Get current user's company ID
 */
export async function getCurrentCompanyId(): Promise<string | undefined> {
  const user = await getCurrentUser()
  return user?.companyId || undefined
}
