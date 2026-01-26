"use client"

interface QuickStatsProps {
  avgValue: number
  lastSentDaysAgo: number | null
  winRate: number
}

export function QuickStats({ avgValue, lastSentDaysAgo, winRate }: QuickStatsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Average Value</span>
          <span className="font-semibold">${(avgValue || 0).toLocaleString()}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Last Sent</span>
          <span className="font-semibold">
            {lastSentDaysAgo !== null ? `${lastSentDaysAgo} days ago` : 'Never'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Win Rate</span>
          <span className={`font-semibold ${winRate > 50 ? 'text-green-600' : 'text-gray-900'}`}>
            {winRate}%
          </span>
        </div>
      </div>
    </div>
  )
}
