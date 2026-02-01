/**
 * POST /api/auth/login
 * Sign-in then return 200 + Set-Cookie (no redirect). Client navigates to /dashboard
 * so cookies are sent on that request. Avoids redirect responses not sending cookies on some runtimes.
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
  const jsonResponse = NextResponse.json({ redirect: '/dashboard' }, { status: 200 })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          jsonResponse.cookies.set(name, value, { ...options, path: '/' })
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

  return jsonResponse
}

function redirectToSignin(originUrl: string, error: string) {
  const url = new URL('/auth/signin', originUrl)
  url.searchParams.set('error', error)
  return NextResponse.redirect(url, 302)
}
