import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        <div className="bg-white rounded-xl shadow-soft-lg border border-border p-8 space-y-6">
          {/* Logo and Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
              <p className="text-muted-foreground mt-1">Sign in to your account</p>
            </div>
          </div>

          {/* Login Form */}
          <Suspense
            fallback={
              <div className="h-32 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          {/* Links */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link
              href="/auth/forgot-password"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Forgot password?
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/auth/signin?debug=1"
              className="text-muted-foreground hover:text-foreground"
            >
              Debug session
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          HVAC Proposal Builder
        </p>
      </div>
    </div>
  )
}
