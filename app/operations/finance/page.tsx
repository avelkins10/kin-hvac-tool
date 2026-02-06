import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { FinanceStatCards } from '@/components/operations/FinanceStatCards'
import { FinanceOperationsTable } from '@/components/operations/FinanceOperationsTable'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

async function getFinanceData(session: any) {
  const where: any = {}

  if (session.user.role !== 'SUPER_ADMIN') {
    where.proposal = { companyId: session.user.companyId }
  }

  if (session.user.role === 'SALES_REP') {
    where.proposal = { ...where.proposal, userId: session.user.id }
  }

  const applications = await prisma.financeApplication.findMany({
    where,
    include: {
      proposal: {
        select: {
          id: true,
          customerData: true,
          status: true,
        },
      },
      milestones: {
        select: {
          id: true,
          milestoneType: true,
          status: true,
          completedAt: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const statusCounts = await prisma.financeApplication.groupBy({
    by: ['status'],
    where,
    _count: { id: true },
  })

  const statusMap: Record<string, number> = {}
  statusCounts.forEach((item) => {
    statusMap[item.status] = item._count.id
  })

  // Count contracts sent and install packages submitted from responseData
  let contractsSent = 0
  let installSubmitted = 0
  for (const app of applications) {
    const rd = app.responseData as any
    if (rd?.contractStatus?.sent) contractsSent++
    if (rd?.installPackage?.submittedAt) installSubmitted++
  }

  return {
    applications: applications.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      milestones: a.milestones.map((m) => ({
        ...m,
        completedAt: m.completedAt?.toISOString() ?? null,
      })),
    })),
    stats: {
      total: applications.length,
      pending: (statusMap.PENDING || 0) + (statusMap.SUBMITTED || 0),
      conditional: statusMap.CONDITIONAL || 0,
      approved: statusMap.APPROVED || 0,
      contractsSent,
      installSubmitted,
    },
  }
}

export default async function FinanceOperationsPage() {
  const session = await requireAuth()
  const data = await getFinanceData(session)

  return (
    <AuthenticatedLayout serverSession={session}>
      <div className="p-6 md:p-8 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Finance Operations</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-semibold text-foreground">Finance Operations</h1>
          <p className="text-muted-foreground mt-1">
            Manage LightReach finance applications across all proposals.
          </p>
        </div>

        <FinanceStatCards {...data.stats} />

        <FinanceOperationsTable applications={data.applications} />
      </div>
    </AuthenticatedLayout>
  )
}
