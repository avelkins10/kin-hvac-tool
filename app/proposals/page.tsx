import { requireAuth } from '@/lib/auth-helpers'
import { ProposalList } from '@/components/proposals/ProposalList'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function ProposalsPage() {
  const session = await requireAuth()

  return (
    <AuthenticatedLayout serverSession={session}>
      <div className="p-6 md:p-8 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Proposals</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Proposals</h1>
            <p className="text-muted-foreground mt-1">View and manage all your proposals</p>
          </div>
          <Link href="/builder">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Proposal
            </Button>
          </Link>
        </div>

        <ProposalList />
      </div>
    </AuthenticatedLayout>
  )
}
