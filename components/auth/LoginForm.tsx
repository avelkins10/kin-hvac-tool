"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle } from 'lucide-react'

/**
 * Native form POST to /api/auth/login so browser gets 302 + Set-Cookie
 * and follows to /dashboard in the same navigation (no fetch).
 */
export function LoginForm() {
  const searchParams = useSearchParams()
  const errorFromUrl = searchParams.get('error')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(errorFromUrl)

  useEffect(() => {
    setError(errorFromUrl)
  }, [errorFromUrl])

  function handleSubmit() {
    setError(null)
    setIsLoading(true)
  }

  const debug = searchParams.get('debug') === '1'

  return (
    <form
      action="/api/auth/login"
      method="POST"
      onSubmit={handleSubmit}
      className="space-y-4 w-full"
    >
      {debug && <input type="hidden" name="debug" value="1" />}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Enter your password"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-error-light border border-error/20 rounded-md" role="alert">
          <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Spinner className="mr-2 h-4 w-4" />
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  )
}
