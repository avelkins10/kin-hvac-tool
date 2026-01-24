import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const body = await request.json()
    const { applicationId, status, ...otherData } = body

    // Verify webhook signature (implement based on provider documentation)

    // Find finance application by external application ID
    const application = await prisma.financeApplication.findFirst({
      where: {
        lenderId: params.provider.toLowerCase(),
        externalApplicationId: applicationId,
      },
    })

    if (application) {
      // Update application status
      await prisma.financeApplication.update({
        where: { id: application.id },
        data: {
          status: status.toUpperCase() as any,
          responseData: { ...otherData, status },
        },
      })

      // If approved, send notification email
      if (status === 'approved') {
        const proposal = await prisma.proposal.findUnique({
          where: { id: application.proposalId },
        })

        if (proposal) {
          const customerData = proposal.customerData as any
          if (customerData?.email) {
            // Send approval email (implement emailClient.sendFinanceApprovalEmail)
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error processing ${params.provider} webhook:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
