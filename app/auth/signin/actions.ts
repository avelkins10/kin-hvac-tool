'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type SignInState = { error: string } | null

/**
 * Server Action login per Supabase docs: signInWithPassword sets cookies via
 * createClient() cookieStore; redirect() then sends 302 so the browser
 * receives Set-Cookie and follows in the same navigation.
 */
export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = (formData.get('email') as string)?.trim()?.toLowerCase()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message || 'Invalid email or password' }
  }

  if (!data.session?.user) {
    return { error: 'Login failed. Please try again.' }
  }

  redirect('/dashboard')
}
