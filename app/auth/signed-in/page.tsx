/**
 * GET /auth/signed-in?next=/dashboard
 * Server-side redirect after login so the same request that has the session
 * cookies is used to redirect to dashboard (avoids client-side redirect
 * before cookies are committed).
 */
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'

function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    return '/dashboard'
  }
  return next
}

export default async function SignedInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; debug?: string }>
}) {
  const params = await searchParams
  const next = safeNext(params?.next)

  // Debug: show cookie state and redirect after delay (client handles this)
  if (params?.debug === '1') {
    return <SignedInDebugPage next={next} />
  }

  const user = await getCurrentUser()
  if (user) {
    redirect(next)
  }

  redirect('/auth/signin?error=Session+not+found.+Please+sign+in+again.')
}

async function SignedInDebugPage({ next }: { next: string }) {
  const user = await getCurrentUser()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-gray-50">
      <p className="text-sm font-medium text-gray-700">Debug: server saw user on this request</p>
      <pre className="text-xs bg-white p-4 rounded border max-w-lg overflow-auto">
        {JSON.stringify({ hasUser: Boolean(user), userId: user?.id ?? null }, null, 2)}
      </pre>
      <p className="text-sm text-amber-600">
        {user ? `Session present — add ?next=${encodeURIComponent(next)} without debug to redirect.` : 'No session — cookies not seen by server.'}
      </p>
      <p className="text-xs text-gray-500">Remove ?debug=1 to use normal redirect.</p>
    </div>
  )
}
