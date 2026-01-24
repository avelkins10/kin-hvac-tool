"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import Link from 'next/link'

interface Client {
  email: string
  name?: string
  phone?: string
  proposals: any[]
  totalValue: number
  lastProposalDate: string
}

interface ClientCardProps {
  client: Client
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Link href={`/clients/${encodeURIComponent(client.email)}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <CardTitle>{client.name || 'Unnamed Customer'}</CardTitle>
          <CardDescription>{client.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {client.phone && (
              <p className="text-sm text-gray-600">{client.phone}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-sm text-gray-500">Proposals</p>
                <p className="text-lg font-semibold">{client.proposals.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-lg font-semibold">${client.totalValue.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Last proposal: {format(new Date(client.lastProposalDate), 'MMM d, yyyy')}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
