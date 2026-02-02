'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-amber-100">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-600">
            This page couldn’t load. It’s often due to a bad dev server state when running locally.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default" className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Link href="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </div>
        <div className="text-left rounded-lg bg-gray-100 p-4 text-xs text-gray-600">
          <p className="font-medium text-gray-700 mb-1">If this keeps happening (e.g. “page isn’t working” on every click):</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Stop the dev server (Ctrl+C)</li>
            <li>In the project folder run: <code className="bg-gray-200 px-1 rounded">pnpm run dev:clean</code></li>
            <li>Use only that one server at http://localhost:3000</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
