import { requireAuth } from '@/lib/auth-helpers'
import { ClientList } from '@/components/clients/ClientList'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

export default async function ClientsPage() {
  await requireAuth()

  return (
    <AuthenticatedLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-gray-500 mt-1">Manage your customers and their proposals</p>
          </div>
        </div>

        <ClientList />
      </div>
    </AuthenticatedLayout>
  )
}
