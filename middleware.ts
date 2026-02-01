import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public routes - allow access without auth check
  if (
    path.startsWith('/api/auth') ||
    path.startsWith('/api/debug') ||
    (path.startsWith('/proposals/') && path.endsWith('/view')) ||
    path === '/unauthorized' ||
    path === '/auth/signin' ||
    path === '/auth/callback' ||
    path === '/auth/forgot-password' ||
    path === '/auth/set-password' ||
    path.startsWith('/_next') ||
    path.startsWith('/api/webhooks')
  ) {
    return NextResponse.next()
  }

  // Update Supabase session and get user (single operation)
  const { response, user } = await updateSession(request)

  // Check authentication for protected routes
  if (!user) {
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

  // Role/company checks are done server-side via requireAuth/requireRole on protected pages and API routes
  return response
}

export const config = {
  matcher: [
    '/',
    '/auth/callback',
    '/auth/forgot-password',
    '/auth/set-password',
    '/auth/signed-in',
    '/admin/:path*',
    '/proposals/:path*',
    '/dashboard/:path*',
    '/clients/:path*',
    '/builder/:path*',
    '/users/:path*',
  ],
}
