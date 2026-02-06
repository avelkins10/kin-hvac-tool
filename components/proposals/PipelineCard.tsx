"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import Link from 'next/link'
import { getProposalCustomerDisplay } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Proposal {
  id: string
  status: string
  customerData: any
  totals: any
  createdAt: string
  user: {
    id: string
    email: string
    name?: string | null
  }
  financeApplications?: {
    id: string
    status: string
  }[]
}

interface PipelineCardProps {
  proposal: Proposal
}

const financeBadgeConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'LR: Pending', className: 'bg-gray-100 text-gray-600' },
  SUBMITTED: { label: 'LR: Submitted', className: 'bg-blue-100 text-blue-700' },
  APPROVED: { label: 'LR: Approved', className: 'bg-green-100 text-green-700' },
  CONDITIONAL: { label: 'LR: Conditional', className: 'bg-amber-100 text-amber-700' },
  DENIED: { label: 'LR: Denied', className: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'LR: Cancelled', className: 'bg-gray-100 text-gray-500' },
}

export function PipelineCard({ proposal }: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: proposal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const customer = getProposalCustomerDisplay(proposal.customerData)
  const totals = proposal.totals as any

  const financeApp = proposal.financeApplications?.[0]
  const badge = financeApp ? financeBadgeConfig[financeApp.status] : null

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/proposals/${proposal.id}/view`}>
        <Card className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">
                {customer.name}
              </h3>
              {totals?.total && (
                <p className="text-lg font-bold text-blue-600">
                  ${totals.total.toFixed(2)}
                </p>
              )}
              {badge && (
                <span className={cn('inline-block px-1.5 py-0.5 text-[10px] font-medium rounded', badge.className)}>
                  {badge.label}
                </span>
              )}
              <p className="text-xs text-gray-500">
                {format(new Date(proposal.createdAt), 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-gray-400">
                {proposal.user.name || proposal.user.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
