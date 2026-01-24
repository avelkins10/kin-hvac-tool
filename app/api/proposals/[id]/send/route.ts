import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { emailClient } from '@/lib/email/email-client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
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

    // Generate proposal URL (public view)
    const proposalUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/proposals/${params.id}/view`

    // Send email
    try {
      await emailClient.sendProposalEmail(customerData.email, params.id, proposalUrl)
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Continue even if email fails
    }

    // Update proposal status
    const updated = await prisma.proposal.update({
      where: { id: params.id },
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
