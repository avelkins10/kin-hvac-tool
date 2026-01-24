import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SALES_REP' | 'CUSTOMER'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/api/auth/signin')
  }
  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth()
  const userRole = session.user.role as UserRole
  
  if (!allowedRoles.includes(userRole)) {
    redirect('/unauthorized')
  }
  return session
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function getCurrentCompanyId() {
  const session = await getServerSession(authOptions)
  return session?.user?.companyId as string | undefined
}
