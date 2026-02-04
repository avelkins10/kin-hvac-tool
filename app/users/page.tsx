import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { UserList } from '@/components/users/UserList'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

export default async function UsersPage() {
  const session = await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])

  return (
    <AuthenticatedLayout serverSession={session}>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-500 mt-1">Manage users and their access levels</p>
          </div>
        </div>

        <UserList />
      </div>
    </AuthenticatedLayout>
  )
}
