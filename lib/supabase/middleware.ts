/**
 * Supabase Middleware Helper
 * For use in Next.js middleware to refresh auth tokens and get user
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type CookieOptions } from '@supabase/ssr'

function hasSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && key)
}

/**
 * Update session and get user in a single operation
 * This ensures we use the same Supabase client and response for both operations
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!hasSupabaseEnv()) {
    return { response: supabaseResponse, user: null }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user - this will also refresh tokens if needed
  const { data: { user } } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}

/**
 * @deprecated Use updateSession() instead which returns both response and user
 * Get the current user in Edge middleware (no Prisma/Node APIs).
 * Use for auth redirects only; role/company checks belong in requireAuth/requireRole.
 */
export async function getMiddlewareUser(request: NextRequest) {
  const { user } = await updateSession(request)
  return user
}
