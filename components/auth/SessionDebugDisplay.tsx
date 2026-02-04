'use client'

import { useEffect, useState } from 'react'

type SessionDebug = {
  cookieCount: number
  supabaseUser: { id: string; email?: string } | null
  dbUser: { id: string; email: string } | null
  error?: string
}

export function SessionDebugDisplay() {
  const [data, setData] = useState<SessionDebug | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/debug/session')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setData({ cookieCount: 0, supabaseUser: null, dbUser: null, error: String(err) }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-gray-500">Loading session debug...</p>
  return (
    <pre className="text-xs bg-white p-4 rounded border max-w-lg overflow-auto text-left">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
