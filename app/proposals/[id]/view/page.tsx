import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

interface PageProps {
  params: { id: string }
}

export default async function ProposalViewPage({ params }: PageProps) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
  })

  if (!proposal) {
    notFound()
  }

  const customerData = proposal.customerData as any
  const totals = proposal.totals as any
  const selectedEquipment = proposal.selectedEquipment as any

  return (
    <AuthenticatedLayout>
      <div className="bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">HVAC Proposal</h1>

        {customerData && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{customerData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{customerData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{customerData.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {customerData.address}, {customerData.city}, {customerData.state} {customerData.zip}
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
            </div>
          </div>
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
