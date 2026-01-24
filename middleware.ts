import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Protect root route - redirect to signin if not authenticated
    if (path === '/' && !token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

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

    // Protect dashboard routes
    if (path.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // Protect clients routes
    if (path.startsWith('/clients')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // Protect builder route
    if (path.startsWith('/builder')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // Protect users route - only admins
    if (path.startsWith('/users')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
      if (token.role !== 'COMPANY_ADMIN' && token.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
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
          path === '/unauthorized' ||
          path === '/auth/signin'
        ) {
          return true
        }

        // Protected routes require authentication
        if (
          path === '/' ||
          path.startsWith('/admin') ||
          path.startsWith('/dashboard') ||
          path.startsWith('/clients') ||
          path.startsWith('/builder') ||
          path.startsWith('/users') ||
          (path.startsWith('/proposals') && !path.endsWith('/view'))
        ) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ['/', '/admin/:path*', '/proposals/:path*', '/dashboard/:path*', '/clients/:path*', '/builder/:path*', '/users/:path*'],
}
