import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data } = body

    // Verify webhook signature (implement based on DocuSign documentation)
    // For now, we'll trust the webhook

    if (event === 'envelope_completed' || event === 'envelope_signed') {
      const envelopeId = data.envelopeId

      // Find signature request by envelope ID
      const signatureRequest = await prisma.signatureRequest.findFirst({
        where: {
          envelopeId: envelopeId,
        },
        include: {
          proposal: true,
        },
      })

      if (signatureRequest) {
        // Update signature request status
        await prisma.signatureRequest.update({
          where: { id: signatureRequest.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        })

        // Update proposal status to ACCEPTED
        await prisma.proposal.update({
          where: { id: signatureRequest.proposalId },
          data: {
            status: 'ACCEPTED',
          },
        })

        // Send notification email (implement as needed)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing DocuSign webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
