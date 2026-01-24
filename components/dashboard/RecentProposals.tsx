"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'

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
}

interface RecentProposalsProps {
  proposals: Proposal[]
}

export function RecentProposals({ proposals }: RecentProposalsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-500'
      case 'SENT':
        return 'bg-blue-500'
      case 'VIEWED':
        return 'bg-yellow-500'
      case 'ACCEPTED':
        return 'bg-green-500'
      case 'REJECTED':
        return 'bg-red-500'
      case 'EXPIRED':
        return 'bg-gray-400'
      default:
        return 'bg-gray-500'
    }
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Proposals</CardTitle>
          <CardDescription>No proposals yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Proposals</CardTitle>
        <CardDescription>Your latest proposal activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const customer = proposal.customerData as any
            const totals = proposal.totals as any

            return (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}/view`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {customer?.name || 'Unnamed Customer'}
                      </h3>
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {customer?.email || 'No email'} • {format(new Date(proposal.createdAt), 'MMM d, yyyy')}
                    </p>
                    {totals?.total && (
                      <p className="text-sm font-medium mt-1">
                        ${totals.total.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="mt-4">
          <Link
            href="/proposals"
            className="text-sm text-blue-600 hover:underline"
          >
            View all proposals →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
