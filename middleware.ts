import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function middleware(request: NextRequest) {
  // Update Supabase session (refreshes tokens)
  const response = await updateSession(request)

  const path = request.nextUrl.pathname

  // Public routes - allow access
  if (
    path.startsWith('/api/auth') ||
    (path.startsWith('/proposals/') && path.endsWith('/view')) ||
    path === '/unauthorized' ||
    path === '/auth/signin' ||
    path.startsWith('/_next') ||
    path.startsWith('/api/webhooks')
  ) {
    return response
  }

  // Check authentication for protected routes
  const supabase = await createClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()

  // If not authenticated, redirect to signin
  if (!supabaseUser) {
    if (
      path === '/' ||
      path.startsWith('/admin') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/clients') ||
      path.startsWith('/builder') ||
      path.startsWith('/users') ||
      (path.startsWith('/proposals') && !path.endsWith('/view'))
    ) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    return response
  }

  // Get User record to check role
  const user = await prisma.user.findUnique({
    where: { supabaseUserId: supabaseUser.id },
    select: { role: true },
  })

  if (!user) {
    // User exists in Supabase Auth but not in our User table
    // Redirect to signin (shouldn't happen after migration)
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Protect admin routes - require COMPANY_ADMIN or SUPER_ADMIN
  if (path.startsWith('/admin') || path.startsWith('/users')) {
    if (user.role !== 'COMPANY_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/proposals/:path*',
    '/dashboard/:path*',
    '/clients/:path*',
    '/builder/:path*',
    '/users/:path*',
  ],
}
