import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const where: any = {}

    // Company isolation
    if (session.user.role === 'SUPER_ADMIN') {
      // Super admin can see all, but we'll filter by companyId if provided
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

    // Get proposal counts by status
    const statusCounts = await prisma.proposal.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    })

    // Get recent proposals (last 10)
    const recentProposals = await prisma.proposal.findMany({
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
      take: 10,
    })

    // Get proposals expiring soon (within 7 days)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const expiringSoon = await prisma.proposal.findMany({
      where: {
        ...where,
        expiresAt: {
          lte: sevenDaysFromNow,
          gte: new Date(),
        },
        status: {
          not: 'EXPIRED',
        },
      },
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
        expiresAt: 'asc',
      },
      take: 5,
    })

    // Calculate totals
    const totalProposals = await prisma.proposal.count({ where })
    const totalValue = await prisma.proposal.aggregate({
      where: {
        ...where,
        totals: {
          not: null,
        },
      },
      _sum: {
        // We'll need to calculate this from JSON, but for now return count
      },
    })

    // Format status counts
    const statusCountsMap: Record<string, number> = {
      DRAFT: 0,
      SENT: 0,
      VIEWED: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      EXPIRED: 0,
    }

    statusCounts.forEach((item) => {
      statusCountsMap[item.status] = item._count.id
    })

    return NextResponse.json({
      statusCounts: statusCountsMap,
      totalProposals,
      recentProposals,
      expiringSoon,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
