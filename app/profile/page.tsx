import { requireAuth } from '@/lib/auth-helpers'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { ProfileForm } from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const session = await requireAuth()

  return (
    <AuthenticatedLayout serverSession={session}>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>
        <ProfileForm />
      </div>
    </AuthenticatedLayout>
  )
}
