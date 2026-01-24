import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Protect admin routes
    if (path.startsWith('/admin')) {
      if (token?.role !== 'COMPANY_ADMIN' && token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Protect proposals routes - allow public view routes (ending with /view)
    if (path.startsWith('/proposals') && !path.endsWith('/view')) {
      if (!token) {
        return NextResponse.redirect(new URL('/api/auth/signin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Public routes
        if (
          path.startsWith('/api/auth') ||
          (path.startsWith('/proposals/') && path.endsWith('/view')) ||
          path === '/' ||
          path === '/unauthorized' ||
          path === '/auth/signin'
        ) {
          return true
        }

        // Protected routes require authentication
        if (path.startsWith('/admin') || (path.startsWith('/proposals') && !path.endsWith('/view'))) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/proposals/:path*'],
}
