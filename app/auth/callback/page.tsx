import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'

/**
 * Auth callback: after client-side sign-in, the browser is sent here so the
 * server can read the session from cookies and redirect to the app.
 * This avoids the server not seeing cookies when redirecting straight to /dashboard.
 */
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next: nextUrl } = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Allow only relative paths to avoid open redirect
  const safeNext =
    nextUrl &&
    nextUrl.startsWith('/') &&
    !nextUrl.startsWith('//') &&
    !nextUrl.includes('://')
      ? nextUrl
      : '/dashboard'

  redirect(safeNext)
}
