import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'

export async function GET(
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
    if (session.user.role !== 'SUPER_ADMIN') {
      if (proposal.companyId !== session.user.companyId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (session.user.role === 'SALES_REP' && proposal.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const versions = await prisma.proposalVersion.findMany({
      where: { proposalId: params.id },
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
