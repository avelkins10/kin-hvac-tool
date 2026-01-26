"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Send, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardStatsProps {
  statusCounts: Record<string, number>
  totalProposals: number
}

export function DashboardStats({ statusCounts, totalProposals }: DashboardStatsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const stats = [
    {
      label: 'Total Proposals',
      value: totalProposals,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Draft',
      value: statusCounts.DRAFT || 0,
      icon: FileText,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      gradient: 'from-slate-500 to-slate-600',
      borderColor: 'border-slate-200',
    },
    {
      label: 'Sent',
      value: statusCounts.SENT || 0,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Viewed',
      value: statusCounts.VIEWED || 0,
      icon: Eye,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      gradient: 'from-amber-500 to-amber-600',
      borderColor: 'border-amber-200',
    },
    {
      label: 'Accepted',
      value: statusCounts.ACCEPTED || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      gradient: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-200',
    },
    {
      label: 'Rejected',
      value: statusCounts.REJECTED || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      gradient: 'from-red-500 to-red-600',
      borderColor: 'border-red-200',
    },
    {
      label: 'Expired',
      value: statusCounts.EXPIRED || 0,
      icon: Clock,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      gradient: 'from-gray-400 to-gray-500',
      borderColor: 'border-gray-200',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card 
            key={stat.label}
            className={cn(
              "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
              stat.borderColor
            )}
            style={{
              animationDelay: mounted ? `${index * 50}ms` : '0ms',
            }}
          >
            <div className={cn(
              "absolute top-0 right-0 w-20 h-20 opacity-10",
              `bg-gradient-to-br ${stat.gradient}`
            )} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-700">{stat.label}</CardTitle>
              <div className={cn(
                "p-2 rounded-lg",
                stat.bgColor
              )}>
                <Icon className={cn("h-5 w-5", stat.color)} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className={cn(
                "text-3xl font-bold transition-all duration-300",
                stat.color
              )}>
                {mounted ? stat.value : '0'}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
