'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

function SignedInRedirect() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const debug = searchParams.get('debug') === '1'
  const [debugInfo, setDebugInfo] = useState<{ cookiePresent: boolean; cookieHeader: string } | null>(null)

  useEffect(() => {
    if (debug) {
      fetch('/api/debug-auth')
        .then((r) => r.json())
        .then((d) => setDebugInfo(d))
        .catch(() => setDebugInfo({ cookiePresent: false, cookieHeader: '(fetch failed)' }))
      return
    }
    const safe =
      next.startsWith('/') && !next.startsWith('//') && !next.includes('://')
        ? next
        : '/dashboard'
    window.location.replace(safe)
  }, [next, debug])

  useEffect(() => {
    if (!debug || !debugInfo) return
    const t = setTimeout(() => {
      const safe =
        next.startsWith('/') && !next.startsWith('//') && !next.includes('://')
          ? next
          : '/dashboard'
      window.location.replace(safe)
    }, 4000)
    return () => clearTimeout(t)
  }, [debug, debugInfo, next])

  if (debug && debugInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-gray-50">
        <p className="text-sm font-medium text-gray-700">Debug: what the server saw on this request</p>
        <pre className="text-xs bg-white p-4 rounded border max-w-lg overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        <p className="text-sm text-amber-600">
          {debugInfo.cookiePresent ? 'Cookies present — redirecting in 4s.' : 'No cookies — session not sent to server.'}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-8 w-8 text-blue-600" />
        <p className="text-gray-600">Taking you to the dashboard…</p>
      </div>
    </div>
  )
}

export default function SignedInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
          <Spinner className="h-8 w-8 text-blue-600" />
        </div>
      }
    >
      <SignedInRedirect />
    </Suspense>
  )
}
