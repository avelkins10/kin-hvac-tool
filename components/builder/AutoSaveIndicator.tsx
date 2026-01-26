"use client"

import { Spinner } from '@/components/ui/spinner'
import { Check, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface AutoSaveIndicatorProps {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  className?: string
}

export function AutoSaveIndicator({ 
  isSaving, 
  lastSaved, 
  error,
  className 
}: AutoSaveIndicatorProps) {
  if (error) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-red-600", className)}>
        <AlertCircle className="w-3 h-3" />
        <span>Save failed</span>
      </div>
    )
  }

  if (isSaving) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-gray-500", className)}>
        <Spinner className="w-3 h-3" />
        <span>Saving...</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-gray-500", className)}>
        <Check className="w-3 h-3 text-green-600" />
        <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
      </div>
    )
  }

  return null
}
