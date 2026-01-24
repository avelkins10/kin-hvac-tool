import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { docuSignClient } from '@/lib/integrations/docusign'
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

    // Create DocuSign envelope
    const envelope = await docuSignClient.createEnvelope({
      proposalId,
      documentBase64,
      documentName: `Proposal_${proposalId}.pdf`,
      signers,
      emailSubject: emailSubject || 'Please sign your HVAC proposal agreement',
      emailBlurb: emailBlurb || 'Please review and sign the attached proposal agreement.',
    })

    // Save signature request to database with envelope ID
    const signatureRequest = await prisma.signatureRequest.create({
      data: {
        proposalId,
        provider: 'docusign',
        envelopeId: envelope.envelopeId,
        status: envelope.status.toUpperCase() as any,
        documentUrl: `https://demo.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=${envelope.envelopeId}`,
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
