"use client"

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight, AlertCircle, FileText, Plus } from 'lucide-react'
import { cn, getProposalCustomerDisplay } from '@/lib/utils'

interface CustomerData {
  name?: string
  email?: string
}

interface ProposalTotals {
  total?: number
}

interface Proposal {
  id: string
  status: string
  customerData: CustomerData | null
  totals: ProposalTotals | null
  createdAt: string
  user: {
    id: string
    email: string
    name?: string | null
  }
}

interface RecentProposalsProps {
  proposals: Proposal[]
}

function ProposalListItem({ proposal }: { proposal: Proposal }) {
  const customer = getProposalCustomerDisplay(proposal.customerData)
  const totals = proposal.totals
  const hasCustomerInfo = customer.name !== 'Unnamed Customer' || !!customer.email

  const initials = hasCustomerInfo
    ? customer.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SENT: 'bg-info-light text-info',
    VIEWED: 'bg-warning-light text-warning',
    ACCEPTED: 'bg-success-light text-success',
    REJECTED: 'bg-error-light text-error',
    EXPIRED: 'bg-gray-100 text-gray-500',
  }

  return (
    <Link
      href={`/proposals/${proposal.id}/view`}
      className="flex items-center gap-4 p-3 rounded-lg border border-transparent
                 hover:border-border hover:bg-gray-50/50 transition-colors group"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-600
                      flex items-center justify-center font-medium text-sm flex-shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-foreground truncate">
            {customer.name}
          </span>
          <span className={cn(
            "px-1.5 py-0.5 text-xs font-medium rounded",
            statusColors[proposal.status] || 'bg-gray-100 text-gray-600'
          )}>
            {proposal.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {customer.email ? (
            <span className="truncate">{customer.email}</span>
          ) : hasCustomerInfo ? (
            <span className="flex items-center gap-1 text-warning">
              <AlertCircle className="w-3 h-3" />
              No email
            </span>
          ) : (
            <span className="text-primary-600 font-medium">Add customer info</span>
          )}
          <span className="text-gray-300">•</span>
          <span>{format(new Date(proposal.createdAt), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Amount & Arrow */}
      <div className="text-right flex-shrink-0">
        {totals?.total && (
          <div className="font-semibold text-foreground">
            ${totals.total.toLocaleString()}
          </div>
        )}
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500
                               group-hover:translate-x-0.5 transition-all ml-auto mt-1" />
      </div>
    </Link>
  )
}

export function RecentProposals({ proposals }: RecentProposalsProps) {
  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-foreground">Recent Proposals</h3>
          <p className="text-sm text-muted-foreground">Your latest proposal activity</p>
        </div>
        <Link
          href="/proposals"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all
        </Link>
      </div>

      <div className="space-y-1">
        {proposals.slice(0, 5).map(proposal => (
          <ProposalListItem key={proposal.id} proposal={proposal} />
        ))}
      </div>

      {proposals.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-muted-foreground mb-3">No proposals yet</p>
          <Link href="/builder">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create your first proposal
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
