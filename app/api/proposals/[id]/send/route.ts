import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { emailClient } from '@/lib/email/email-client'
import { generateProposalPDF } from '@/lib/templates/proposal-generator'
import { uploadProposalPDF } from '@/lib/storage/supabase-storage'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireAuth()

    const resolvedParams = await Promise.resolve(params)
    const proposalId = resolvedParams.id

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check access
    if (session.user.role !== 'SUPER_ADMIN' && proposal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const customerData = proposal.customerData as any
    if (!customerData?.email) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 })
    }

    // Generate proposal PDF and upload to Supabase Storage (path only; use signed URL when serving)
    try {
      const pdfBuffer = await generateProposalPDF(proposal)
      const { path } = await uploadProposalPDF(
        pdfBuffer,
        proposalId,
        session.user.companyId || proposal.companyId
      )
      console.log(`Proposal PDF uploaded to Supabase: ${path}`)
    } catch (pdfError) {
      console.error('Failed to generate/upload proposal PDF:', pdfError)
      // Continue with email even if PDF generation fails
    }

    // Generate proposal URL (public view) — ensure absolute URL with protocol
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000')
    const proposalUrl = `${baseUrl}/proposals/${proposalId}/view`

    // Send email (optionally attach PDF if generated)
    try {
      await emailClient.sendProposalEmail(customerData.email, proposalId, proposalUrl)
      // Note: Email attachments can be added later if needed
      // For now, we just send the link and store the PDF in Supabase
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Continue even if email fails
    }

    // Update proposal status
    const updated = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'SENT',
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error sending proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
