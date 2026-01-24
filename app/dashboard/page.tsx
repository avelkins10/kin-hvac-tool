import { requireAuth } from '@/lib/auth-helpers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentProposals } from '@/components/dashboard/RecentProposals'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

async function getDashboardData() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return {
      statusCounts: {},
      totalProposals: 0,
      recentProposals: [],
      expiringSoon: [],
    }
  }

  const where: any = {}

  // Company isolation
  if (session.user.role === 'SUPER_ADMIN') {
    // Super admin can see all
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

  return {
    statusCounts: statusCountsMap,
    totalProposals,
    recentProposals,
    expiringSoon,
  }
}

export default async function DashboardPage() {
  await requireAuth()
  const data = await getDashboardData()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your overview.</p>
        </div>
        <Link href="/builder">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Proposal
          </Button>
        </Link>
      </div>

      <DashboardStats
        statusCounts={data.statusCounts}
        totalProposals={data.totalProposals}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentProposals proposals={data.recentProposals} />

        {data.expiringSoon && data.expiringSoon.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Expiring Soon
              </CardTitle>
              <CardDescription>Proposals expiring within 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.expiringSoon.map((proposal: any) => {
                  const customer = proposal.customerData as any
                  return (
                    <Link
                      key={proposal.id}
                      href={`/proposals/${proposal.id}/view`}
                      className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {customer?.name || 'Unnamed Customer'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Expires: {proposal.expiresAt ? new Date(proposal.expiresAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/proposals">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>All Proposals</CardTitle>
              <CardDescription>View and manage all proposals</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/proposals/pipeline">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Pipeline View</CardTitle>
              <CardDescription>Visual workflow board</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/clients">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Clients</CardTitle>
              <CardDescription>Manage your customers</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
