"use client"

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { signInAction } from '@/app/auth/signin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, formAction, isPending] = useActionState(signInAction, null)

  // Full page navigation so browser loads dashboard with session cookies (avoids RSC staying on signin)
  useEffect(() => {
    if (state && 'redirect' in state && state.redirect) {
      window.location.href = state.redirect
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-6 w-full">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isPending}
          placeholder="Enter your password"
          className="h-11 transition-all focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md transition-all" 
        disabled={isPending}
      >
        {isPending ? (
          <span className="flex items-center justify-center">
            <Spinner className="mr-2 h-5 w-5 text-white" />
            Logging in...
          </span>
        ) : (
          'Sign In'
        )}
      </Button>
      {state?.error && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {state.error}
        </p>
      )}
    </form>
  )
}
