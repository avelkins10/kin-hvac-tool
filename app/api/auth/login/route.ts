/**
 * POST /api/auth/login
 * Full-page form POST: sign in on server, set cookies on response, 302 to dashboard.
 * Browser follows redirect with cookies — no RSC/fetch, so login always works.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = (formData.get('email') as string)?.trim()?.toLowerCase()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return redirectToSignin(request.url, 'Email and password are required')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirectToSignin(request.url, error.message || 'Invalid email or password')
  }

  if (!data.session?.user) {
    return redirectToSignin(request.url, 'Login failed. Please try again.')
  }

  const url = new URL(request.url)
  const dashboard = new URL('/dashboard', url.origin)
  return NextResponse.redirect(dashboard, 302)
}

function redirectToSignin(originUrl: string, error: string) {
  const url = new URL('/auth/signin', originUrl)
  url.searchParams.set('error', error)
  return NextResponse.redirect(url, 302)
}
