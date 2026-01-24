'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FinanceApplicationStatus } from './FinanceApplicationStatus'
import { CheckCircle2, XCircle, Clock, AlertCircle, Plus } from 'lucide-react'

interface FinanceApplicationListProps {
  proposalId: string
  onNewApplication?: () => void
}

interface ApplicationListItem {
  id: string
  status: string
  lenderId: string
  externalApplicationId?: string
  responseData?: {
    monthlyPayment?: number
    totalCost?: number
    message?: string
  }
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Pending',
    variant: 'secondary',
    icon: <Clock className="size-4" />,
  },
  SUBMITTED: {
    label: 'Submitted',
    variant: 'default',
    icon: <Clock className="size-4" />,
  },
  APPROVED: {
    label: 'Approved',
    variant: 'default',
    icon: <CheckCircle2 className="size-4" />,
  },
  DENIED: {
    label: 'Denied',
    variant: 'destructive',
    icon: <XCircle className="size-4" />,
  },
  CONDITIONAL: {
    label: 'Conditional',
    variant: 'outline',
    icon: <AlertCircle className="size-4" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'secondary',
    icon: <XCircle className="size-4" />,
  },
}

export function FinanceApplicationList({
  proposalId,
  onNewApplication,
}: FinanceApplicationListProps) {
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [proposalId])

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/finance-applications`)

      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      } else if (response.status === 404) {
        // No applications found
        setApplications([])
      } else {
        throw new Error('Failed to fetch applications')
      }
    } catch (error) {
      console.error('Error fetching finance applications:', error)
      toast.error('Failed to fetch finance applications')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="size-6" />
          <span className="ml-2">Loading applications...</span>
        </CardContent>
      </Card>
    )
  }

  if (selectedApplicationId) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setSelectedApplicationId(null)}
        >
          ← Back to List
        </Button>
        <FinanceApplicationStatus applicationId={selectedApplicationId} autoRefresh />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Finance Applications</CardTitle>
            <CardDescription>
              {applications.length === 0
                ? 'No finance applications submitted yet'
                : `${applications.length} application${applications.length === 1 ? '' : 's'}`}
            </CardDescription>
          </div>
          {onNewApplication && (
            <Button onClick={onNewApplication} size="sm">
              <Plus className="size-4 mr-2" />
              New Application
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No finance applications have been submitted for this proposal.</p>
            {onNewApplication && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={onNewApplication}
              >
                <Plus className="size-4 mr-2" />
                Submit First Application
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const status = app.status.toUpperCase()
              const config = statusConfig[status] || statusConfig.PENDING
              const responseData = app.responseData || {}

              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedApplicationId(app.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={config.variant} className="gap-1">
                        {config.icon}
                        {config.label}
                      </Badge>
                      {app.externalApplicationId && (
                        <span className="text-xs text-muted-foreground">
                          ID: {app.externalApplicationId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    {responseData.monthlyPayment && (
                      <p className="text-sm font-medium">
                        Monthly Payment: ${responseData.monthlyPayment.toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(app.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details →
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
