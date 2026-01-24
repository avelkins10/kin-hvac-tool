"use client"

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Workflow,
  Save,
  Menu,
  X,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'

interface BuilderNavigationProps {
  onSave: () => Promise<void>
  proposalId?: string | null
  isSaving?: boolean
}

export function BuilderNavigation({ onSave, proposalId, isSaving = false }: BuilderNavigationProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSave = async () => {
    try {
      await onSave()
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Proposals', href: '/proposals', icon: FileText },
    { name: 'Pipeline', href: '/proposals/pipeline', icon: Workflow },
    { name: 'Clients', href: '/clients', icon: Users },
  ]

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HV</span>
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">
                HVAC Proposals
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:ml-10 md:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side: Save button, Proposal ID, and mobile menu */}
          <div className="flex items-center space-x-4">
            {/* Proposal ID indicator */}
            {proposalId && (
              <div className="hidden sm:flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
                <FileText className="w-3 h-3 mr-1.5" />
                Saved: {proposalId.slice(0, 8)}...
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : proposalId ? 'Save Changes' : 'Save Proposal'}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <Home className="w-5 h-5 mr-3" />
              Exit Builder
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
