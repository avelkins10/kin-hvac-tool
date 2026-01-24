import { requireAuth } from '@/lib/auth-helpers'
import { PipelineBoard } from '@/components/proposals/PipelineBoard'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

export default async function PipelinePage() {
  await requireAuth()

  return (
    <AuthenticatedLayout>
      <div className="bg-gray-50">
        <div className="p-6 border-b bg-white">
          <h1 className="text-3xl font-bold">Proposal Pipeline</h1>
          <p className="text-gray-500 mt-1">Drag and drop proposals to update their status</p>
        </div>
        <PipelineBoard />
      </div>
    </AuthenticatedLayout>
  )
}
