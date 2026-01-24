import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { docuSignClient } from '@/lib/integrations/docusign'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { id: params.id },
      include: {
        proposal: true,
      },
    })

    if (!signatureRequest) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 })
    }

    // Check access
    if (session.user.role !== 'SUPER_ADMIN' && signatureRequest.proposal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch latest status from DocuSign using stored envelope ID
    if (!signatureRequest.envelopeId) {
      return NextResponse.json({ error: 'Envelope ID not found' }, { status: 400 })
    }

    const status = await docuSignClient.getEnvelopeStatus(signatureRequest.envelopeId)

    // Update database with latest status
    const updated = await prisma.signatureRequest.update({
      where: { id: params.id },
      data: {
        status: status.status.toUpperCase() as any,
        ...(status.status === 'completed' && { completedAt: new Date(status.completedDateTime || new Date()) }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error fetching signature status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
