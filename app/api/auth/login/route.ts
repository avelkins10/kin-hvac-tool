/**
 * POST /api/auth/login
 * Sign-in using Supabase Auth with proper cookie handling via next/headers
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

  const cookieStore = await cookies()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            console.log('[LOGIN] Setting cookie:', { name, hasValue: !!value, options })
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          console.error('[LOGIN] Error setting cookies:', error)
        }
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[LOGIN] Auth error:', error.message)
    return redirectToSignin(request.url, error.message || 'Invalid email or password')
  }

  if (!data.session?.user) {
    console.error('[LOGIN] No session or user in response')
    return redirectToSignin(request.url, 'Login failed. Please try again.')
  }

  console.log('[LOGIN] Success for user:', data.user.email)
  console.log('[LOGIN] Session expires at:', data.session.expires_at)

  // Return JSON response - cookies are automatically included by Next.js
  return NextResponse.json({ redirect: '/dashboard' }, { status: 200 })
}

function redirectToSignin(originUrl: string, error: string) {
  const url = new URL('/auth/signin', originUrl)
  url.searchParams.set('error', error)
  return NextResponse.redirect(url, 302)
}
