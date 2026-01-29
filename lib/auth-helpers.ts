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

  // Get User record from database to get role and companyId
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
