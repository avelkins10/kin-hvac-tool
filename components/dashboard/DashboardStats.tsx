"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Send, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'

interface DashboardStatsProps {
  statusCounts: Record<string, number>
  totalProposals: number
}

export function DashboardStats({ statusCounts, totalProposals }: DashboardStatsProps) {
  const stats = [
    {
      label: 'Total Proposals',
      value: totalProposals,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Draft',
      value: statusCounts.DRAFT || 0,
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      label: 'Sent',
      value: statusCounts.SENT || 0,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Viewed',
      value: statusCounts.VIEWED || 0,
      icon: Eye,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Accepted',
      value: statusCounts.ACCEPTED || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Rejected',
      value: statusCounts.REJECTED || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Expired',
      value: statusCounts.EXPIRED || 0,
      icon: Clock,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
