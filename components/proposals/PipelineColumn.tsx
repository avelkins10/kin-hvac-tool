"use client"

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PipelineCard } from './PipelineCard'

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

interface PipelineColumnProps {
  status: string
  proposals: Proposal[]
  label: string
  color: string
}

export function PipelineColumn({ status, proposals, label, color }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const proposalIds = proposals.map((p) => p.id)

  return (
    <Card className={`flex-1 min-w-[280px] ${isOver ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className={`${color} text-white`}>
        <CardTitle className="flex items-center justify-between">
          <span>{label}</span>
          <span className="bg-white/20 px-2 py-1 rounded text-sm">
            {proposals.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
        <SortableContext items={proposalIds} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef}>
            {proposals.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                No proposals
              </div>
            ) : (
              proposals.map((proposal) => (
                <PipelineCard key={proposal.id} proposal={proposal} />
              ))
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  )
}
