import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle Next.js 15 async params
    const resolvedParams = await Promise.resolve(params)
    const proposalId = resolvedParams.id

    // Verify proposal exists and user has access
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

    // Sales reps can only see their own proposals
    if (session.user.role === 'SALES_REP' && proposal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch finance applications for this proposal
    const applications = await prisma.financeApplication.findMany({
      where: {
        proposalId: proposalId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Error fetching finance applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
