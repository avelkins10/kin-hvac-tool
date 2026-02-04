"use client"

import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface OutcomesSummaryProps {
  accepted: number
  rejected: number
  expired: number
  total: number
}

export function OutcomesSummary({ accepted, rejected, expired, total }: OutcomesSummaryProps) {
  const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0

  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <h3 className="font-medium text-foreground mb-4">Outcomes</h3>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-success-light rounded-lg">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Accepted</span>
          </div>
          <div className="text-2xl font-semibold text-success">{accepted}</div>
        </div>

        <div className="text-center p-3 bg-error-light rounded-lg">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <XCircle className="w-4 h-4 text-error" />
            <span className="text-sm text-muted-foreground">Rejected</span>
          </div>
          <div className="text-2xl font-semibold text-error">{rejected}</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-muted-foreground">Expired</span>
          </div>
          <div className="text-2xl font-semibold text-gray-600">{expired}</div>
        </div>
      </div>

      {/* Conversion Rate Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-muted-foreground">Conversion Rate</span>
          <span className="font-medium">{conversionRate}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${conversionRate}%` }}
          />
        </div>
      </div>
    </div>
  )
}
