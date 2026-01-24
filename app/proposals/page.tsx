import { requireAuth } from '@/lib/auth-helpers'
import { ProposalList } from '@/components/proposals/ProposalList'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

export default async function ProposalsPage() {
  await requireAuth()
  
  return (
    <AuthenticatedLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Proposals</h1>
          <p className="text-gray-500 mt-1">View and manage all your proposals</p>
        </div>
        <ProposalList />
      </div>
    </AuthenticatedLayout>
  )
}
