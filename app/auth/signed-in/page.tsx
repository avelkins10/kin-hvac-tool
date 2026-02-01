'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

function SignedInRedirect() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  useEffect(() => {
    const safe =
      next.startsWith('/') && !next.startsWith('//') && !next.includes('://')
        ? next
        : '/dashboard'
    window.location.replace(safe)
  }, [next])

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
