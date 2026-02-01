'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

/**
 * Intermediate page after login: full document load with session cookies,
 * then client redirect to dashboard. Avoids redirect-after-POST cookie issues.
 */
export default function SignedInPage() {
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
