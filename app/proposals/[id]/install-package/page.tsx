import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { InstallPackageForm } from '@/components/finance/InstallPackageForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InstallPackagePage({ params }: PageProps) {
  const session = await requireAuth()
  const { id: proposalId } = await params

  if (!proposalId) {
    notFound()
  }

  // Load proposal with finance applications
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
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

  // Find the approved LightReach finance application for this proposal
  const financeApplication = await prisma.financeApplication.findFirst({
    where: {
      proposalId,
      lenderId: 'lightreach',
      status: {
        in: ['approved', 'APPROVED', 'conditional', 'CONDITIONAL'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!financeApplication || !financeApplication.externalApplicationId) {
    // Redirect back to proposal view if no approved application
    redirect(`/proposals/${proposalId}/view`)
  }

  const customerData = proposal.customerData as any
  const selectedEquipment = proposal.selectedEquipment as any

  // Build initial data from proposal if available
  const initialInstallData = selectedEquipment
    ? {
        systemDesign: {
          isPreliminary: false,
          systems: [
            {
              systemCategory: mapEquipmentToCategory(selectedEquipment) as any,
              conditionedArea: customerData?.squareFootage || 0,
              equipment: {
                items: [
                  {
                    type: mapEquipmentType(selectedEquipment) as any,
                    name: `${selectedEquipment.brand || ''} ${selectedEquipment.model || ''}`.trim() || 'HVAC System',
                    manufacturer: selectedEquipment.brand || 'Other',
                    model: selectedEquipment.model || '',
                    quantity: 1,
                    serialNumbers: [''],
                    size: {
                      unit: 'ton' as const,
                      value: selectedEquipment.tonnage?.toString() || '',
                    },
                    efficiencies: [
                      {
                        unit: 'SEER2' as const,
                        value: selectedEquipment.seer?.toString() || '',
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      }
    : undefined

  return (
    <AuthenticatedLayout serverSession={session}>
      <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href={`/proposals/${proposalId}/view`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to Proposal
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold">Submit Install Package</h1>
            <p className="text-muted-foreground mt-1">
              Complete the installation details for NTP approval and funding.
            </p>
            {customerData?.name && (
              <p className="text-sm text-muted-foreground mt-2">
                Customer: {customerData.name}
              </p>
            )}
          </div>

          <InstallPackageForm
            accountId={financeApplication.externalApplicationId}
            proposalId={proposalId}
            initialData={initialInstallData}
            onSuccess={() => {
              // Client-side navigation will be handled by the form
            }}
          />
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

// Helper functions to map proposal equipment to LightReach categories
function mapEquipmentToCategory(equipment: any): string {
  const type = equipment?.type?.toLowerCase() || ''
  const brand = equipment?.brand?.toLowerCase() || ''

  if (type.includes('mini') || brand.includes('mitsubishi') || brand.includes('fujitsu')) {
    return 'Single Zone Mini Split'
  }
  if (type.includes('heat pump') || type.includes('heatpump')) {
    return 'Heat Pump Split System'
  }
  if (type.includes('packaged') || type.includes('package')) {
    return 'Package'
  }
  if (type.includes('dual fuel')) {
    return 'Dual Fuel Split System'
  }
  if (type.includes('gas')) {
    return 'Gas Conventional Split System'
  }

  return 'Conventional Ducted Split System'
}

function mapEquipmentType(equipment: any): string {
  const type = equipment?.type?.toLowerCase() || ''

  if (type.includes('heat pump') || type.includes('heatpump')) {
    return 'heatPump'
  }
  if (type.includes('furnace')) {
    return 'furnace'
  }
  if (type.includes('air handler')) {
    return 'airHandler'
  }
  if (type.includes('air conditioner') || type.includes('ac')) {
    return 'airConditioner'
  }
  if (type.includes('mini') && type.includes('indoor')) {
    return 'ductlessIndoor'
  }
  if (type.includes('mini') && type.includes('outdoor')) {
    return 'ductlessOutdoor'
  }

  return 'heatPump'
}
