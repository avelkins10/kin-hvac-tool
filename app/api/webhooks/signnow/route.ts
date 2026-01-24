import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data } = body

    // Verify webhook signature (implement based on SignNow documentation)
    // SignNow webhooks can be verified using the webhook secret
    // For now, we'll trust the webhook
    // TODO: Implement webhook signature verification
    // const signature = request.headers.get('x-signnow-signature')
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    // SignNow webhook events: document.complete, document.decline, document.field_invite.complete, etc.
    if (event === 'document.complete' || event === 'document.field_invite.complete') {
      const documentId = data.document_id || data.document?.id

      if (!documentId) {
        console.error('SignNow webhook missing document_id')
        return NextResponse.json({ error: 'Missing document_id' }, { status: 400 })
      }

      // Find signature request by document ID (stored in envelopeId field)
      const signatureRequest = await prisma.signatureRequest.findFirst({
        where: {
          envelopeId: documentId,
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
            signedDocumentUrl: data.document?.download_link || null,
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
        // TODO: Send email notification when document is signed
      } else {
        console.warn(`SignNow webhook: No signature request found for document ${documentId}`)
      }
    } else if (event === 'document.decline') {
      const documentId = data.document_id || data.document?.id

      if (documentId) {
        const signatureRequest = await prisma.signatureRequest.findFirst({
          where: {
            envelopeId: documentId,
          },
        })

        if (signatureRequest) {
          await prisma.signatureRequest.update({
            where: { id: signatureRequest.id },
            data: {
              status: 'DECLINED',
            },
          })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing SignNow webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
