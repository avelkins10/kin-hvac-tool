"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Proposal {
  id: string
  status: string
  customerData: any
  totals: any
  createdAt: string
  updatedAt: string
  expiresAt?: string | null
  user: {
    id: string
    email: string
    name?: string | null
  }
}

interface ClientProposalsProps {
  proposals: Proposal[]
  clientEmail: string
}

export function ClientProposals({ proposals, clientEmail }: ClientProposalsProps) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Proposal History</CardTitle>
            <CardDescription>{proposals.length} proposal(s) for this client</CardDescription>
          </div>
          <Link href="/builder">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const totals = proposal.totals as any

            return (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}/view`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Proposal #{proposal.id.slice(0, 8)}</h3>
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p>Created: {format(new Date(proposal.createdAt), 'MMM d, yyyy')}</p>
                        {proposal.expiresAt && (
                          <p>Expires: {format(new Date(proposal.expiresAt), 'MMM d, yyyy')}</p>
                        )}
                      </div>
                      <div>
                        <p>By: {proposal.user.name || proposal.user.email}</p>
                        {totals?.total && (
                          <p className="font-semibold text-gray-900">
                            ${totals.total.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
