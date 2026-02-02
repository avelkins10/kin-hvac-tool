import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { OutcomesSummary } from '@/components/dashboard/OutcomesSummary'
import { RecentProposals } from '@/components/dashboard/RecentProposals'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { NavCard } from '@/components/dashboard/NavCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle, FileText, Send, Eye, Users, UserCog, Workflow } from 'lucide-react'
import Link from 'next/link'
import { getProposalCustomerDisplay } from '@/lib/utils'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'

async function getDashboardData() {
  const session = await requireAuth()
  if (!session.user) {
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

  // Calculate additional stats for QuickStats
  const sentProposals = await prisma.proposal.findMany({
    where: {
      ...where,
      status: 'SENT',
    },
    select: {
      createdAt: true,
      totals: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const acceptedProposals = await prisma.proposal.findMany({
    where: {
      ...where,
      status: 'ACCEPTED',
    },
    select: {
      totals: true,
    },
  })

  // Calculate average value
  const allProposalsWithTotals = await prisma.proposal.findMany({
    where,
    select: {
      totals: true,
    },
  })

  const totalValue = allProposalsWithTotals.reduce((sum, p) => {
    const totals = p.totals as { total?: number } | null
    return sum + (totals?.total || 0)
  }, 0)
  const avgValue = allProposalsWithTotals.length > 0 ? totalValue / allProposalsWithTotals.length : 0

  // Calculate last sent days ago
  const lastSent = sentProposals[0]?.createdAt
  const lastSentDaysAgo = lastSent
    ? Math.floor((new Date().getTime() - new Date(lastSent).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Calculate win rate (accepted / (accepted + rejected))
  const rejectedCount = statusCountsMap.REJECTED || 0
  const acceptedCount = statusCountsMap.ACCEPTED || 0
  const winRate = acceptedCount + rejectedCount > 0
    ? Math.round((acceptedCount / (acceptedCount + rejectedCount)) * 100)
    : 0

  return {
    statusCounts: statusCountsMap,
    totalProposals,
    recentProposals,
    expiringSoon,
    avgValue,
    lastSentDaysAgo,
    winRate,
  }
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const data = await getDashboardData()

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-6 py-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Welcome back! Here's your overview.</p>
          </div>
          <Link href="/builder">
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              New Proposal
            </Button>
          </Link>
        </div>

        {/* Metric Cards - Full Width, 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Proposals"
            value={data.totalProposals}
            icon="FileText"
            accentColor="blue"
            href="/proposals"
          />
          <MetricCard
            title="Draft"
            value={data.statusCounts.DRAFT || 0}
            icon="FileText"
            accentColor="gray"
            subtitle={data.statusCounts.DRAFT > 0 ? `${data.statusCounts.DRAFT} ready to send` : undefined}
            href="/proposals?status=DRAFT"
          />
          <MetricCard
            title="Sent"
            value={data.statusCounts.SENT || 0}
            icon="Send"
            accentColor="amber"
            subtitle={data.statusCounts.SENT === 0 ? "Send your first!" : undefined}
            href="/proposals?status=SENT"
          />
          <MetricCard
            title="Viewed"
            value={data.statusCounts.VIEWED || 0}
            icon="Eye"
            accentColor="green"
            href="/proposals?status=VIEWED"
          />
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Proposals */}
            <RecentProposals proposals={data.recentProposals} />

            {/* Outcomes Summary */}
            <OutcomesSummary
              accepted={data.statusCounts.ACCEPTED || 0}
              rejected={data.statusCounts.REJECTED || 0}
              expired={data.statusCounts.EXPIRED || 0}
              total={data.totalProposals}
            />

            {/* Expiring Soon */}
            {data.expiringSoon && data.expiringSoon.length > 0 && (
              <Card className="border-2 border-amber-200 bg-amber-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <span>Expiring Soon</span>
                  </CardTitle>
                  <CardDescription>Proposals expiring within 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.expiringSoon.map((proposal) => {
                      const customer = getProposalCustomerDisplay(proposal.customerData)
                      const expiresAt = proposal.expiresAt ? new Date(proposal.expiresAt) : null
                      const daysUntilExpiry = expiresAt 
                        ? Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : null
                      
                      return (
                        <Link
                          key={proposal.id}
                          href={`/proposals/${proposal.id}/view`}
                          className="block p-4 border-2 border-amber-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-all duration-200 group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                                {customer.name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {expiresAt 
                                  ? `Expires ${daysUntilExpiry === 0 ? 'today' : `in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`} • ${expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                  : 'No expiration date'}
                              </p>
                            </div>
                            {daysUntilExpiry !== null && daysUntilExpiry <= 3 && (
                              <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-md shrink-0">
                                Urgent
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Takes 1/3 width */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <QuickStats
              avgValue={data.avgValue}
              lastSentDaysAgo={data.lastSentDaysAgo}
              winRate={data.winRate}
            />

            {/* Quick Actions */}
            <QuickActions />

            {/* Navigation Cards */}
            <div className="space-y-3">
              <NavCard
                title="All Proposals"
                description="View and manage all proposals"
                icon="FileText"
                count={data.totalProposals}
                href="/proposals"
              />
              <NavCard
                title="Pipeline View"
                description="Visual workflow board"
                icon="Workflow"
                href="/proposals/pipeline"
              />
              <NavCard
                title="Clients"
                description="Manage your customers"
                icon="Users"
                href="/clients"
              />
              {(session?.user?.role === 'COMPANY_ADMIN' || session?.user?.role === 'SUPER_ADMIN') && (
                <NavCard
                  title="Users"
                  description="Manage team members"
                  icon="UserCog"
                  href="/users"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
