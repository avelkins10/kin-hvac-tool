import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'
import { Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SetPasswordPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin?error=Session+expired.+Request+a+new+reset+link.')
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Set new password</h1>
              <p className="text-gray-500 mt-2">
                Enter your new password below.
              </p>
            </div>
          </div>
          <UpdatePasswordForm />
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          HVAC Proposal Builder © 2025
        </p>
      </div>
    </div>
  )
}
