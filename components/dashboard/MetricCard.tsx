"use client"

import Link from 'next/link'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  trend?: { value: number; label: string }
  accentColor: 'blue' | 'gray' | 'amber' | 'green' | 'red'
  href?: string
  subtitle?: string
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  accentColor,
  href,
  subtitle
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    gray: 'bg-gray-50 border-gray-200 text-gray-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
  }

  const content = (
    <div className={cn(
      "p-5 rounded-xl border-2 transition-all cursor-pointer group",
      colorClasses[accentColor],
      "hover:shadow-md"
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <div className="p-2 rounded-lg bg-white/60">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      
      {trend && (
        <div className="flex items-center gap-1 text-sm">
          {trend.value >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
            {trend.value >= 0 ? '+' : ''}{trend.value}
          </span>
          <span className="text-gray-500">{trend.label}</span>
        </div>
      )}
      
      {subtitle && (
        <div className="text-sm text-gray-500 mt-1 group-hover:text-blue-600 transition-colors">
          {subtitle} →
        </div>
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
