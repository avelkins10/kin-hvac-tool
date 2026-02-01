"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

/**
 * Plain form POST to /api/auth/login so the browser does a full page submit.
 * Server sets session cookies and returns 302 → browser follows with cookies.
 * No RSC/fetch — most reliable login flow.
 */
export function LoginForm() {
  const searchParams = useSearchParams()
  const errorFromUrl = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(errorFromUrl ?? null)

  useEffect(() => {
    setError(errorFromUrl)
  }, [errorFromUrl])

  return (
    <form
      action="/api/auth/login"
      method="POST"
      className="space-y-6 w-full"
      onSubmit={() => setIsSubmitting(true)}
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
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          required
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          placeholder="Enter your password"
          className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button
        type="submit"
        className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md transition-all"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
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
