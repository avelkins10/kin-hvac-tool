"use client"

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { PipelineColumn } from './PipelineColumn'
import { PipelineCard } from './PipelineCard'
import { toast } from 'sonner'

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

const STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-600' },
  { value: 'SENT', label: 'Sent', color: 'bg-blue-600' },
  { value: 'VIEWED', label: 'Viewed', color: 'bg-yellow-600' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'bg-green-600' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-600' },
  { value: 'EXPIRED', label: 'Expired', color: 'bg-gray-400' },
]

export function PipelineBoard() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/proposals?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProposals(data.proposals || [])
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
      toast.error('Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    const proposalId = active.id as string
    const newStatus = over.id as string

    // Find the proposal
    const proposal = proposals.find((p) => p.id === proposalId)
    if (!proposal || proposal.status === newStatus) {
      return
    }

    // Optimistically update UI
    const updatedProposals = proposals.map((p) =>
      p.id === proposalId ? { ...p, status: newStatus } : p
    )
    setProposals(updatedProposals)

    // Update on server
    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        // Revert on error
        setProposals(proposals)
        toast.error('Failed to update proposal status')
      } else {
        toast.success('Proposal status updated')
      }
    } catch (error) {
      // Revert on error
      setProposals(proposals)
      toast.error('Failed to update proposal status')
    }
  }

  const getProposalsByStatus = (status: string) => {
    return proposals.filter((p) => p.status === status)
  }

  const activeProposal = activeId ? proposals.find((p) => p.id === activeId) : null

  if (loading) {
    return <div className="p-8">Loading pipeline...</div>
  }

  return (
    <div className="p-6">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={STATUSES.map((s) => s.value)} strategy={horizontalListSortingStrategy}>
            {STATUSES.map((status) => (
              <PipelineColumn
                key={status.value}
                status={status.value}
                proposals={getProposalsByStatus(status.value)}
                label={status.label}
                color={status.color}
              />
            ))}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeProposal ? (
            <div className="w-[280px]">
              <PipelineCard proposal={activeProposal} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
