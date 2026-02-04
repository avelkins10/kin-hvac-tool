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
import { Plus, AlertTriangle } from 'lucide-react'
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

  if (session.user.role === 'SUPER_ADMIN') {
  } else {
    where.companyId = session.user.companyId
  }

  if (session.user.role === 'SALES_REP') {
    where.userId = session.user.id
  }

  const statusCounts = await prisma.proposal.groupBy({
    by: ['status'],
    where,
    _count: {
      id: true,
    },
  })

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

  const totalProposals = await prisma.proposal.count({ where })

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

  const lastSent = sentProposals[0]?.createdAt
  const lastSentDaysAgo = lastSent
    ? Math.floor((new Date().getTime() - new Date(lastSent).getTime()) / (1000 * 60 * 60 * 24))
    : null

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
    <AuthenticatedLayout serverSession={session}>
      <div className="p-6 md:p-8 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your overview.</p>
          </div>
          <Link href="/builder">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Proposal
            </Button>
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <RecentProposals proposals={data.recentProposals} />

            <OutcomesSummary
              accepted={data.statusCounts.ACCEPTED || 0}
              rejected={data.statusCounts.REJECTED || 0}
              expired={data.statusCounts.EXPIRED || 0}
              total={data.totalProposals}
            />

            {data.expiringSoon && data.expiringSoon.length > 0 && (
              <Card className="border-warning/30 bg-warning-light/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="p-1.5 bg-warning/10 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                    Expiring Soon
                  </CardTitle>
                  <CardDescription>Proposals expiring within 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
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
                          className="block p-3 border border-warning/20 rounded-lg hover:border-warning/40 hover:bg-warning-light/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {expiresAt
                                  ? `Expires ${daysUntilExpiry === 0 ? 'today' : `in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}`
                                  : 'No expiration'}
                              </p>
                            </div>
                            {daysUntilExpiry !== null && daysUntilExpiry <= 3 && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-error/10 text-error rounded">
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

          {/* Right Column */}
          <div className="space-y-6">
            <QuickStats
              avgValue={data.avgValue}
              lastSentDaysAgo={data.lastSentDaysAgo}
              winRate={data.winRate}
            />

            <QuickActions />

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
