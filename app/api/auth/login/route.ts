/**
 * POST /api/auth/login
 * Server-side sign-in; session cookies are set on the redirect response so the
 * browser receives Set-Cookie and then follows the redirect to /dashboard with cookies.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = (formData.get('email') as string)?.trim()?.toLowerCase()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return redirectToSignin(request.url, 'Email and password are required')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectToSignin(request.url, 'Server misconfigured. Contact support.')
  }

  const url = new URL(request.url)
  const signedIn = new URL('/auth/signed-in', url.origin)
  signedIn.searchParams.set('next', '/dashboard')
  const redirectResponse = NextResponse.redirect(signedIn, 302)

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          redirectResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirectToSignin(request.url, error.message || 'Invalid email or password')
  }

  if (!data.session?.user) {
    return redirectToSignin(request.url, 'Login failed. Please try again.')
  }

  return redirectResponse
}

function redirectToSignin(originUrl: string, error: string) {
  const url = new URL('/auth/signin', originUrl)
  url.searchParams.set('error', error)
  return NextResponse.redirect(url, 302)
}
