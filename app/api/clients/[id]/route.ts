import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    // Decode the email (id is URL-encoded email)
    const email = decodeURIComponent(params.id)

    // Get all proposals and filter by email in application code
    // Prisma JSON filtering can be tricky, so we'll fetch and filter
    const where: any = {}

    // Company isolation
    if (session.user.role === 'SUPER_ADMIN') {
      const companyId = new URL(request.url).searchParams.get('companyId')
      if (companyId) {
        where.companyId = companyId
      }
    } else {
      where.companyId = session.user.companyId
    }

    // User filter - Sales reps only see their own proposals
    if (session.user.role === 'SALES_REP') {
      where.userId = session.user.id
    }

    // Get all proposals and filter by email
    const allProposals = await prisma.proposal.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter proposals by customer email
    const proposals = allProposals.filter((proposal) => {
      const customerData = proposal.customerData as any
      return customerData?.email?.toLowerCase() === email.toLowerCase()
    })

    if (proposals.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Extract client info from first proposal
    const firstProposal = proposals[0]
    const customerData = firstProposal.customerData as any

    // Calculate totals
    let totalValue = 0
    proposals.forEach((proposal) => {
      const totals = proposal.totals as any
      if (totals?.total) {
        totalValue += totals.total
      }
    })

    return NextResponse.json({
      client: {
        email: customerData?.email || email,
        name: customerData?.name,
        phone: customerData?.phone,
        address: customerData?.address,
        city: customerData?.city,
        state: customerData?.state,
        zip: customerData?.zip,
      },
      proposals,
      totalValue,
      proposalCount: proposals.length,
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
