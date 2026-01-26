"use client"

import Link from 'next/link'
import { ChevronRight, FileText, Users, UserCog, Workflow } from 'lucide-react'

type IconName = 'FileText' | 'Users' | 'UserCog' | 'Workflow'

const iconMap = {
  FileText,
  Users,
  UserCog,
  Workflow,
}

interface NavCardProps {
  title: string
  description: string
  icon: IconName
  count?: number
  href: string
}

export function NavCard({ title, description, icon, count, href }: NavCardProps) {
  const Icon = iconMap[icon]
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200
                 hover:border-blue-200 hover:shadow-md transition-all group"
    >
      <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
        <Icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      {count !== undefined && (
        <div className="text-2xl font-bold text-gray-300">{count}</div>
      )}
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
    </Link>
  )
}
