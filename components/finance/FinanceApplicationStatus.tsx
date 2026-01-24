'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

interface FinanceApplicationStatusProps {
  applicationId: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

interface ApplicationData {
  id: string
  status: string
  lenderId: string
  externalApplicationId?: string
  applicationData?: any
  responseData?: {
    status?: string
    monthlyPayment?: number
    totalCost?: number
    apr?: number
    term?: number
    termYears?: number
    escalatorRate?: number
    leaseType?: string
    message?: string
    paymentSchedule?: any
    lastFetched?: string
  }
  createdAt: string
  updatedAt: string
  cached?: boolean
  cacheAge?: number
  lastUpdated?: string
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

export function FinanceApplicationStatus({
  applicationId,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}: FinanceApplicationStatusProps) {
  const [application, setApplication] = useState<ApplicationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStatus = async (forceRefresh = false) => {
    try {
      const url = `/api/finance/lightreach/status/${applicationId}${forceRefresh ? '?refresh=true' : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch application status')
      }

      const data = await response.json()
      setApplication(data)
    } catch (error) {
      console.error('Error fetching application status:', error)
      toast.error('Failed to fetch application status')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchStatus()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [applicationId, autoRefresh, refreshInterval])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStatus(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="size-6" />
          <span className="ml-2">Loading application status...</span>
        </CardContent>
      </Card>
    )
  }

  if (!application) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Application not found</p>
        </CardContent>
      </Card>
    )
  }

  const status = application.status.toUpperCase()
  const config = statusConfig[status] || statusConfig.PENDING
  const responseData = application.responseData || {}

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Finance Application Status</CardTitle>
            <CardDescription>
              Application ID: {application.id.slice(0, 8)}...
              {application.externalApplicationId && (
                <> • External ID: {application.externalApplicationId}</>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
          {application.cached && (
            <span className="text-xs text-muted-foreground">
              (Cached {application.cacheAge}s ago)
            </span>
          )}
        </div>

        {responseData.monthlyPayment && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-2xl font-bold">
                  ${responseData.monthlyPayment.toFixed(2)}
                </p>
              </div>
              {responseData.totalCost && (
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">
                    ${responseData.totalCost.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            {(responseData.term || responseData.termYears || responseData.escalatorRate !== undefined) && (
              <div className="mt-4 space-y-2">
                {application.lenderId === 'lightreach' && responseData.leaseType ? (
                  // Comfort Plan lease display
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Plan: </span>
                      <span className="font-medium">{responseData.leaseType}</span>
                    </div>
                    {responseData.termYears && (
                      <div>
                        <span className="text-muted-foreground">Term: </span>
                        <span className="font-medium">{responseData.termYears} years ({responseData.term || responseData.termYears * 12} months)</span>
                      </div>
                    )}
                    {responseData.escalatorRate !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Escalator: </span>
                        <span className="font-medium">
                          {responseData.escalatorRate === 0 
                            ? '0% (Fixed payment)' 
                            : `${responseData.escalatorRate}% annually`}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">APR: </span>
                      <span className="font-medium">0% (Lease)</span>
                    </div>
                  </div>
                ) : (
                  // Regular loan display
                  <div className="flex gap-4 text-sm">
                    {responseData.apr !== undefined && (
                      <div>
                        <span className="text-muted-foreground">APR: </span>
                        <span className="font-medium">{responseData.apr}%</span>
                      </div>
                    )}
                    {responseData.term && (
                      <div>
                        <span className="text-muted-foreground">Term: </span>
                        <span className="font-medium">{responseData.term} months</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {responseData.message && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium mb-1">Message</p>
            <p className="text-sm text-muted-foreground">{responseData.message}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Created: {new Date(application.createdAt).toLocaleString()}
          </p>
          {application.lastUpdated && (
            <p>
              Last Updated: {new Date(application.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
