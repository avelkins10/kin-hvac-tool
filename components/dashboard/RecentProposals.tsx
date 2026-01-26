"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function RecentProposals({ proposals }: RecentProposalsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-500 text-white'
      case 'SENT':
        return 'bg-blue-500 text-white'
      case 'VIEWED':
        return 'bg-amber-500 text-white'
      case 'ACCEPTED':
        return 'bg-emerald-500 text-white'
      case 'REJECTED':
        return 'bg-red-500 text-white'
      case 'EXPIRED':
        return 'bg-gray-400 text-white'
      default:
        return 'bg-slate-500 text-white'
    }
  }

  if (proposals.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Recent Proposals</CardTitle>
          <CardDescription>No proposals yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Create your first proposal to see it here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Recent Proposals</CardTitle>
        <CardDescription>Your latest proposal activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {proposals.slice(0, 5).map((proposal) => {
            const customer = proposal.customerData
            const totals = proposal.totals

            return (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}/view`}
                className="block p-4 border-2 rounded-lg hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {customer?.name || 'Unnamed Customer'}
                      </h3>
                      <Badge className={cn("shrink-0 text-xs font-medium", getStatusColor(proposal.status))}>
                        {proposal.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-1 truncate">
                      {customer?.email || 'No email'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{format(new Date(proposal.createdAt), 'MMM d, yyyy')}</span>
                      {totals?.total && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-gray-700">
                            ${totals.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            )
          })}
        </div>
        <div className="mt-6 pt-4 border-t">
          <Link
            href="/proposals"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group"
          >
            View all proposals
            <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
