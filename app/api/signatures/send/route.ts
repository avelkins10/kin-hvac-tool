import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { signNowClient } from '@/lib/integrations/signnow'
import { generateAgreementPDF } from '@/lib/templates/agreement-generator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { proposalId, signers, emailSubject, emailBlurb } = body

    if (!proposalId || !signers || !Array.isArray(signers) || signers.length === 0) {
      return NextResponse.json(
        { error: 'proposalId and signers array are required' },
        { status: 400 }
      )
    }

    // Verify proposal exists and user has access
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && proposal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate agreement PDF
    const pdfBuffer = await generateAgreementPDF(proposal)
    const documentBase64 = pdfBuffer.toString('base64')

    // Create SignNow document and send for signing
    const document = await signNowClient.createDocument({
      proposalId,
      documentBase64,
      documentName: `Proposal_${proposalId}.pdf`,
      signers,
      emailSubject: emailSubject || 'Please sign your HVAC proposal agreement',
      emailMessage: emailBlurb || 'Please review and sign the attached proposal agreement.',
    })

    // Map SignNow status to our status enum
    let mappedStatus = document.status.toUpperCase()
    if (mappedStatus === 'COMPLETED') {
      mappedStatus = 'COMPLETED'
    } else if (mappedStatus === 'PENDING') {
      mappedStatus = 'PENDING'
    } else if (mappedStatus === 'SENT') {
      mappedStatus = 'SENT'
    } else {
      mappedStatus = 'PENDING'
    }

    // Save signature request to database with document ID
    const signatureRequest = await prisma.signatureRequest.create({
      data: {
        proposalId,
        provider: 'signnow',
        envelopeId: document.documentId, // Using envelopeId field to store SignNow document ID
        status: mappedStatus as any,
        documentUrl: `https://app.signnow.com/document/${document.documentId}`,
        signers: signers,
      },
    })

    return NextResponse.json(signatureRequest, { status: 201 })
  } catch (error) {
    console.error('Error sending signature request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
