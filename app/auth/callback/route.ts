/**
 * GET /auth/callback
 * Handles redirect from Supabase after magic link, OAuth, or password reset.
 * Exchanges code or verifies token_hash, sets session cookies on redirect response.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const nextPath = url.searchParams.get('next') || '/dashboard'

  const safeNext =
    nextPath.startsWith('/') && !nextPath.startsWith('//') && !nextPath.includes('://')
      ? nextPath
      : '/dashboard'
  const redirectUrl = new URL(safeNext, url.origin)
  const redirectResponse = NextResponse.redirect(redirectUrl, 302)

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/auth/signin?error=Server+misconfigured', url.origin), 302)
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          redirectResponse.cookies.set(name, value, { ...options, path: '/' })
        )
      },
    },
  })

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, url.origin),
        302
      )
    }
    return redirectResponse
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'recovery' | 'email' | 'magiclink' | 'signup',
      token_hash: tokenHash,
    })
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, url.origin),
        302
      )
    }
    return redirectResponse
  }

  return NextResponse.redirect(new URL('/auth/signin', url.origin), 302)
}
