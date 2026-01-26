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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Outcomes</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Accepted</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{accepted}</div>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600">Rejected</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{rejected}</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Expired</span>
          </div>
          <div className="text-2xl font-bold text-gray-600">{expired}</div>
        </div>
      </div>

      {/* Conversion Rate Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Conversion Rate</span>
          <span className="font-medium">{conversionRate}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${conversionRate}%` }}
          />
        </div>
      </div>
    </div>
  )
}
