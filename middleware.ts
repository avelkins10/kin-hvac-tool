import { updateSession, getMiddlewareUser } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

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
    path === '/auth/callback' ||
    path === '/auth/forgot-password' ||
    path === '/auth/set-password' ||
    path.startsWith('/_next') ||
    path.startsWith('/api/webhooks')
  ) {
    return response
  }

  // Check authentication for protected routes (Edge-safe; no Prisma)
  const supabaseUser = await getMiddlewareUser(request)

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
