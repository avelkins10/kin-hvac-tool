"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import Link from 'next/link'

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

interface PipelineCardProps {
  proposal: Proposal
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

  const customer = proposal.customerData as any
  const totals = proposal.totals as any

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/proposals/${proposal.id}/view`}>
        <Card className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">
                {customer?.name || 'Unnamed Customer'}
              </h3>
              {totals?.total && (
                <p className="text-lg font-bold text-blue-600">
                  ${totals.total.toFixed(2)}
                </p>
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
