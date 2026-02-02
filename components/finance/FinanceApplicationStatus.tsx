'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, FileText, Mail, CheckCircle, ExternalLink, ListChecks, Flag } from 'lucide-react'

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
    contractStatus?: {
      sent?: boolean
      sentAt?: string
      signed?: boolean
      signedAt?: string
      approved?: boolean
      approvedAt?: string
      voided?: boolean
      voidedAt?: string
    }
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
  const [stipulations, setStipulations] = useState<any[] | null>(null)
  const [stipulationsLoading, setStipulationsLoading] = useState(false)
  const [signingLinkLoading, setSigningLinkLoading] = useState(false)

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

  // Fetch stipulations when LightReach and status is conditional/approved
  useEffect(() => {
    if (!application?.externalApplicationId || application.externalApplicationId.startsWith('test_')) return
    if (application.lenderId !== 'lightreach') return
    const s = application.status?.toUpperCase()
    if (s !== 'CONDITIONAL' && s !== 'APPROVED') return

    let cancelled = false
    setStipulationsLoading(true)
    fetch(`/api/finance/lightreach/stipulations/${applicationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setStipulations(data)
        else if (!cancelled && data && Array.isArray(data.stipulations)) setStipulations(data.stipulations)
        else if (!cancelled) setStipulations(null)
      })
      .catch(() => { if (!cancelled) setStipulations(null) })
      .finally(() => { if (!cancelled) setStipulationsLoading(false) })

    return () => { cancelled = true }
  }, [applicationId, application?.externalApplicationId, application?.lenderId, application?.status])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStatus(true)
  }

  const handleSignContract = async () => {
    if (!applicationId) return
    setSigningLinkLoading(true)
    try {
      const res = await fetch(`/api/finance/lightreach/signing-link/${applicationId}`)
      const data = await res.json()
      const url = data?.url ?? data?.signingLink
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      else toast.error('No signing link available')
    } catch {
      toast.error('Failed to get signing link')
    } finally {
      setSigningLinkLoading(false)
    }
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

        {/* Contract Status Timeline - Only show for LightReach applications */}
        {application.lenderId === 'lightreach' && responseData.contractStatus && (
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium mb-3">Contract Status</p>
            <div className="space-y-2">
              {/* Contract Sent */}
              <div className="flex items-center gap-2">
                {responseData.contractStatus.sent ? (
                  <>
                    <CheckCircle className="size-4 text-green-600" />
                    <span className="text-sm">
                      Contract sent to customer
                      {responseData.contractStatus.sentAt && (
                        <span className="text-muted-foreground ml-2">
                          {new Date(responseData.contractStatus.sentAt).toLocaleString()}
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Contract not yet sent</span>
                  </>
                )}
              </div>

              {/* Contract Signed */}
              {responseData.contractStatus.sent && (
                <div className="flex items-center gap-2">
                  {responseData.contractStatus.signed ? (
                    <>
                      <CheckCircle className="size-4 text-green-600" />
                      <span className="text-sm">
                        Contract signed by customer
                        {responseData.contractStatus.signedAt && (
                          <span className="text-muted-foreground ml-2">
                            {new Date(responseData.contractStatus.signedAt).toLocaleString()}
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileText className="size-4 text-yellow-600" />
                      <span className="text-sm text-muted-foreground">Awaiting customer signature</span>
                    </>
                  )}
                </div>
              )}

              {/* Contract Approved */}
              {responseData.contractStatus.signed && (
                <div className="flex items-center gap-2">
                  {responseData.contractStatus.approved ? (
                    <>
                      <CheckCircle2 className="size-4 text-green-600" />
                      <span className="text-sm">
                        Contract approved by Palmetto
                        {responseData.contractStatus.approvedAt && (
                          <span className="text-muted-foreground ml-2">
                            {new Date(responseData.contractStatus.approvedAt).toLocaleString()}
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="size-4 text-yellow-600" />
                      <span className="text-sm text-muted-foreground">Awaiting Palmetto approval</span>
                    </>
                  )}
                </div>
              )}

              {/* Contract Voided */}
              {responseData.contractStatus.voided && (
                <div className="flex items-center gap-2">
                  <XCircle className="size-4 text-red-600" />
                  <span className="text-sm text-red-600">
                    Contract voided
                    {responseData.contractStatus.voidedAt && (
                      <span className="text-muted-foreground ml-2">
                        {new Date(responseData.contractStatus.voidedAt).toLocaleString()}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Contract Reinstated */}
              {responseData.contractStatus.reinstated && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    Contract reinstated
                    {responseData.contractStatus.reinstatedAt && (
                      <span className="text-muted-foreground ml-2">
                        {new Date(responseData.contractStatus.reinstatedAt).toLocaleString()}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sign contract button - LightReach when approved/conditional and contract ready */}
        {application.lenderId === 'lightreach' &&
          application.externalApplicationId &&
          !application.externalApplicationId.startsWith('test_') &&
          (status === 'APPROVED' || status === 'CONDITIONAL') && (
          <div className="rounded-lg border p-4">
            <Button
              onClick={handleSignContract}
              disabled={signingLinkLoading}
              className="w-full sm:w-auto"
            >
              {signingLinkLoading ? (
                <Spinner className="size-4 mr-2" />
              ) : (
                <ExternalLink className="size-4 mr-2" />
              )}
              Sign contract
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Opens the Palmetto contract signing page in a new tab.
            </p>
          </div>
        )}

        {/* Stipulations - LightReach conditional approval requirements */}
        {application.lenderId === 'lightreach' && (status === 'CONDITIONAL' || status === 'APPROVED') && (
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <ListChecks className="size-4" />
              Stipulations
            </p>
            {stipulationsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading stipulations...
              </div>
            ) : Array.isArray(stipulations) && stipulations.length > 0 ? (
              <ul className="space-y-2">
                {stipulations.map((s: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>{typeof s === 'object' ? (s.description ?? s.type ?? s.name ?? JSON.stringify(s)) : String(s)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No stipulations or all cleared.</p>
            )}
          </div>
        )}

        {/* Milestones - from webhooks */}
        {(responseData.milestones?.length > 0 || responseData.milestonePackages?.length > 0) && (
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Flag className="size-4" />
              Milestones
            </p>
            <div className="space-y-2">
              {responseData.milestones?.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="size-4 text-green-600" />
                  <span>{m.milestone ?? m}</span>
                  {m.at && (
                    <span className="text-muted-foreground text-xs">{new Date(m.at).toLocaleString()}</span>
                  )}
                </div>
              ))}
              {responseData.milestonePackages?.map((p: any, i: number) => (
                <div key={`pkg-${i}`} className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>{p.type ?? 'Package'}: {p.status ?? '—'}</span>
                  {p.at && (
                    <span className="text-muted-foreground text-xs">{new Date(p.at).toLocaleString()}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {responseData.quoteExceedsPaymentCap && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              This quote exceeds the monthly payment cap. Review with the customer.
            </p>
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
