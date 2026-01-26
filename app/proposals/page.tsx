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
  await requireAuth()
  
  return (
    <AuthenticatedLayout>
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
            <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
            <p className="text-gray-500 mt-1.5">View and manage all your proposals</p>
          </div>
        </div>
        <ProposalList />
      </div>
    </AuthenticatedLayout>
  )
}
