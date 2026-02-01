"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

/**
 * Standard Supabase flow: client-side signInWithPassword with createBrowserClient.
 * Session is stored in cookies by @supabase/ssr; then full-page redirect so server sees cookies.
 */
export function LoginForm() {
  const searchParams = useSearchParams()
  const errorFromUrl = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(errorFromUrl)

  useEffect(() => {
    setError(errorFromUrl)
  }, [errorFromUrl])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    if (signInError) {
      setError(signInError.message || 'Invalid email or password')
      setIsLoading(false)
      return
    }

    if (!data.session?.user) {
      setError('Login failed. Please try again.')
      setIsLoading(false)
      return
    }

    // Supabase browser client persists session to cookies; brief delay then full-page nav
    // so the next request (dashboard) includes the session cookies.
    await new Promise((r) => setTimeout(r, 100))
    window.location.href = '/dashboard'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          required
          disabled={isLoading}
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
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError(null)
          }}
          required
          disabled={isLoading}
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
