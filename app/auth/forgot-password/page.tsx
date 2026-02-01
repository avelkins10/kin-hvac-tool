import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="w-full max-w-md p-8 md:p-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reset password</h1>
              <p className="text-gray-500 mt-2">
                Enter your email and we’ll send you a link to reset your password.
              </p>
            </div>
          </div>
          <ForgotPasswordForm />
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          HVAC Proposal Builder © 2025
        </p>
      </div>
    </div>
  )
}
