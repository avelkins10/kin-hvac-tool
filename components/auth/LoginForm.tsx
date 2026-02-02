"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

/**
 * Submits via fetch. API returns 302 to /dashboard with Set-Cookie so the
 * browser stores session cookies; we then use res.url for full page load.
 * Also supports JSON { redirect } for compatibility.
 */
export function LoginForm() {
  const searchParams = useSearchParams()
  const errorFromUrl = searchParams.get('error')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(errorFromUrl)

  useEffect(() => {
    setError(errorFromUrl)
  }, [errorFromUrl])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        redirect: 'manual',
      })
      // 302 / manual redirect: browser has stored Set-Cookie; navigate so cookies are sent
      if (res.type === 'opaqueredirect' || res.status === 302) {
        const location = res.headers.get('Location')
        const target =
          location && location.startsWith('/')
            ? new URL(location, window.location.origin).href
            : location || new URL('/dashboard', window.location.origin).href
        window.location.href = target
        return
      }
      if (res.redirected) {
        window.location.href = res.url
        return
      }
      if (!res.ok) {
        const text = await res.text()
        setError(text || 'Login failed')
        setIsLoading(false)
        return
      }
      const data = (await res.json()) as { redirect?: string }
      window.location.href = data.redirect ?? '/dashboard'
    } catch {
      setError('Network error. Try again.')
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-full"
    >
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Enter your password"
          className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button
        type="submit"
        className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md transition-all"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Spinner className="mr-2 h-5 w-5 text-white" />
            Logging in...
          </span>
        ) : (
          'Sign In'
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
