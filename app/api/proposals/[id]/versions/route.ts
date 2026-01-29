import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(
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
    if (session.user.role !== 'SUPER_ADMIN') {
      if (proposal.companyId !== session.user.companyId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (session.user.role === 'SALES_REP' && proposal.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const versions = await prisma.proposalVersion.findMany({
      where: { proposalId: proposalId },
      orderBy: {
        versionNumber: 'desc',
      },
    })

    return NextResponse.json(versions)
  } catch (error) {
    console.error('Error fetching proposal versions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
