"use client"

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight, AlertCircle, FileText } from 'lucide-react'
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
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    VIEWED: 'bg-amber-100 text-amber-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-500',
  }

  return (
    <Link 
      href={`/proposals/${proposal.id}/view`}
      className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 
                 hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 
                      flex items-center justify-center font-medium text-sm flex-shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-gray-900 truncate">
            {customer.name}
          </span>
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full",
            statusColors[proposal.status] || 'bg-gray-100 text-gray-700'
          )}>
            {proposal.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {customer.email ? (
            <span className="truncate">{customer.email}</span>
          ) : hasCustomerInfo ? (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="w-3 h-3" />
              No email
            </span>
          ) : (
            <span className="text-blue-600 font-medium">Add customer info →</span>
          )}
          <span>•</span>
          <span>{format(new Date(proposal.createdAt), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Amount & Arrow */}
      <div className="text-right flex-shrink-0">
        {totals?.total && (
          <div className="font-semibold text-gray-900">
            ${totals.total.toLocaleString()}
          </div>
        )}
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 
                               group-hover:translate-x-1 transition-all ml-auto mt-1" />
      </div>
    </Link>
  )
}

export function RecentProposals({ proposals }: RecentProposalsProps) {

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Recent Proposals</h3>
          <p className="text-sm text-gray-500">Your latest proposal activity</p>
        </div>
        <Link 
          href="/proposals" 
          className="text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-2">
        {proposals.slice(0, 5).map(proposal => (
          <ProposalListItem key={proposal.id} proposal={proposal} />
        ))}
      </div>

      {proposals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No proposals yet</p>
          <Link href="/builder">
            <Button className="mt-3" variant="outline" size="sm">
              Create your first proposal
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
