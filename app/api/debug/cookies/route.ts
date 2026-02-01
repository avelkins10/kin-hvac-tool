/**
 * DEBUG endpoint to inspect cookies on incoming requests
 * Temporarily added to trace auth cookie flow
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll()

  // Try to get user with Supabase
  let supabaseUser = null
  let supabaseError = null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op for debug
        },
      },
    })

    const { data, error } = await supabase.auth.getUser()
    supabaseUser = data.user
    supabaseError = error
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    path: request.nextUrl.pathname,
    cookieCount: allCookies.length,
    cookies: allCookies.map(c => ({
      name: c.name,
      value: c.value.substring(0, 50) + (c.value.length > 50 ? '...' : ''),
      valueLength: c.value.length,
    })),
    supabaseAuth: {
      hasUser: !!supabaseUser,
      userId: supabaseUser?.id,
      email: supabaseUser?.email,
      error: supabaseError?.message,
    },
  }, { status: 200 })
}
