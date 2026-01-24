import { LoginForm } from '@/components/auth/LoginForm'
import { Toaster } from 'sonner'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
        <LoginForm />
      </div>
      <Toaster />
    </div>
  )
}
