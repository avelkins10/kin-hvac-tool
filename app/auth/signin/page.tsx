import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="w-full max-w-md p-8 md:p-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 space-y-8">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-500 mt-2">Sign in to your HVAC Proposals account</p>
            </div>
          </div>

          {/* Login Form */}
          <Suspense fallback={<div className="h-32 flex items-center justify-center">Loading...</div>}>
            <LoginForm />
          </Suspense>

          <p className="text-center text-sm text-gray-500">
            <Link
              href="/auth/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </p>
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          HVAC Proposal Builder © 2025
        </p>
      </div>
    </div>
  )
}
