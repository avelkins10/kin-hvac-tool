import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { getProposalCustomerDisplay } from '@/lib/utils'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { ProposalFinanceSection } from '@/components/finance/ProposalFinanceSection'
import { EditableCustomerInfo } from '@/components/proposals/EditableCustomerInfo'
import { EditableEquipmentSection } from '@/components/proposals/EditableEquipmentSection'
import { DeleteProposalButton } from '@/components/proposals/DeleteProposalButton'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProposalViewPage({ params }: PageProps) {
  const session = await requireAuth()
  const { id } = await params

  if (!id) {
    notFound()
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id },
  })

  if (!proposal) {
    notFound()
  }

  // Enforce access: company isolation and sales-rep ownership
  if (session.user.role !== 'SUPER_ADMIN' && proposal.companyId !== session.user.companyId) {
    notFound()
  }
  if (session.user.role === 'SALES_REP' && proposal.userId !== session.user.id) {
    notFound()
  }

  const customerData = proposal.customerData as any
  const totals = proposal.totals as any
  const selectedEquipment = proposal.selectedEquipment as any

  // Check if proposal can be edited (not finalized)
  const finalizedStatuses = ['ACCEPTED', 'REJECTED', 'EXPIRED']
  const canEdit = !finalizedStatuses.includes(proposal.status)
  const isAdmin = session.user.role === 'COMPANY_ADMIN' || session.user.role === 'SUPER_ADMIN'

  return (
    <AuthenticatedLayout serverSession={session}>
      <div className="bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h1 className="text-3xl font-bold">HVAC Proposal</h1>
          <div className="flex items-center gap-2">
            {canEdit && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Editable
              </span>
            )}
            {!canEdit && (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                Finalized
              </span>
            )}
            {isAdmin && (
              <DeleteProposalButton proposalId={proposal.id} />
            )}
          </div>
        </div>

        {canEdit ? (
          <>
            <EditableCustomerInfo 
              customerData={customerData} 
              proposalId={proposal.id}
            />
            <EditableEquipmentSection 
              equipment={selectedEquipment} 
              proposalId={proposal.id}
            />
          </>
        ) : (
          <>
            {(customerData != null || proposal.customerData != null) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{getProposalCustomerDisplay(proposal.customerData).name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{getProposalCustomerDisplay(proposal.customerData).email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{customerData.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">
                      {customerData.address || customerData.city || customerData.state || customerData.zip
                        ? `${customerData.address || ''}, ${customerData.city || ''}, ${customerData.state || ''} ${customerData.zip || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedEquipment && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Selected Equipment</h2>
                <div className="bg-gray-50 p-4 rounded">
                  {selectedEquipment.brand && <p><strong>Brand:</strong> {selectedEquipment.brand}</p>}
                  {selectedEquipment.model && <p><strong>Model:</strong> {selectedEquipment.model}</p>}
                  {selectedEquipment.tonnage && <p><strong>Tonnage:</strong> {selectedEquipment.tonnage}</p>}
                  {selectedEquipment.seer && <p><strong>SEER:</strong> {selectedEquipment.seer}</p>}
                </div>
              </div>
            )}
          </>
        )}

        {totals && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pricing Summary</h2>
            <div className="space-y-2">
              {totals.subtotal && (
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
              )}
              {totals.tax && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${totals.tax.toFixed(2)}</span>
                </div>
              )}
              {totals.total && (
                <div className="flex justify-between text-2xl font-bold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <ProposalFinanceSection proposal={proposal} />

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            This proposal is valid for 30 days from the date of issue.
          </p>
        </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
