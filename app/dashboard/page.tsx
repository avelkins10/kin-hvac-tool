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
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'

async function getSession() {
  return await getServerSession(authOptions)
}

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
  const session = await getSession()
  const data = await getDashboardData()

  return (
    <AuthenticatedLayout>
      <div className="p-6 md:p-8 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1.5">Welcome back! Here's your overview.</p>
        </div>
        <Link href="/builder">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md transition-all w-full sm:w-auto">
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
                {data.expiringSoon.map((proposal: any) => {
                  const customer = proposal.customerData as any
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
                            {customer?.name || 'Unnamed Customer'}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/proposals">
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-200 hover:scale-[1.02] group">
            <CardHeader>
              <CardTitle className="group-hover:text-blue-600 transition-colors">All Proposals</CardTitle>
              <CardDescription>View and manage all proposals</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/proposals/pipeline">
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-200 hover:scale-[1.02] group">
            <CardHeader>
              <CardTitle className="group-hover:text-blue-600 transition-colors">Pipeline View</CardTitle>
              <CardDescription>Visual workflow board</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/clients">
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-200 hover:scale-[1.02] group">
            <CardHeader>
              <CardTitle className="group-hover:text-blue-600 transition-colors">Clients</CardTitle>
              <CardDescription>Manage your customers</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        {(session?.user?.role === 'COMPANY_ADMIN' || session?.user?.role === 'SUPER_ADMIN') && (
          <Link href="/users">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-200 hover:scale-[1.02] group">
              <CardHeader>
                <CardTitle className="group-hover:text-blue-600 transition-colors">Users</CardTitle>
                <CardDescription>Manage team members</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}
      </div>
    </div>
    </AuthenticatedLayout>
  )
}
