"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteProposalButtonProps {
  proposalId: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children?: React.ReactNode
  onDeleted?: () => void
}

export function DeleteProposalButton({
  proposalId,
  variant = 'outline',
  size = 'sm',
  children,
  onDeleted,
}: DeleteProposalButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, { method: 'DELETE' })
      if (response.status === 204 || response.ok) {
        toast.success('Proposal deleted')
        setOpen(false)
        onDeleted?.()
        router.push('/proposals')
        router.refresh()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || 'Failed to delete proposal')
      }
    } catch {
      toast.error('Failed to delete proposal')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children ?? (
          <Button variant={variant} size={size} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete proposal
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this proposal?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. The proposal and all related data (versions, signature requests, etc.) will be
            permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
