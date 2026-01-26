"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Filter, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useDebounce } from '@/hooks/use-debounce'

interface CustomerData {
  name?: string
  email?: string
}

interface ProposalTotals {
  total?: number
}

interface Proposal {
  id: string
  status: string
  customerData: CustomerData | null
  totals: ProposalTotals | null
  createdAt: string
  user: {
    id: string
    email: string
  }
}

export function ProposalList() {
  const { data: session } = useSession()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  
  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/proposals?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProposals(data.proposals || [])
      } else {
        toast.error('Failed to load proposals. Please try again.')
      }
    } catch (error) {
      toast.error('An error occurred while loading proposals.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const filteredProposals = proposals.filter((proposal) => {
    if (!debouncedSearchTerm) return true
    const customer = proposal.customerData
    const searchLower = debouncedSearchTerm.toLowerCase()
    return (
      customer?.name?.toLowerCase().includes(searchLower) ||
      customer?.email?.toLowerCase().includes(searchLower) ||
      proposal.id.toLowerCase().includes(searchLower)
    )
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-500 text-white'
      case 'SENT':
        return 'bg-blue-500 text-white'
      case 'VIEWED':
        return 'bg-amber-500 text-white'
      case 'ACCEPTED':
        return 'bg-emerald-500 text-white'
      case 'REJECTED':
        return 'bg-red-500 text-white'
      case 'EXPIRED':
        return 'bg-gray-400 text-white'
      default:
        return 'bg-slate-500 text-white'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-[180px] h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2">
          <Link href="/proposals/pipeline">
            <Button variant="outline" className="w-full sm:w-auto">
              Pipeline View
            </Button>
          </Link>
          <Link href="/builder">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
            aria-hidden="true"
          />
          <Input
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search proposals by customer name, email, or proposal ID"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" aria-label="Filter proposals by status">
            <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="VIEWED">Viewed</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProposals.map((proposal) => {
          const customer = proposal.customerData
          const totals = proposal.totals

          return (
            <Link key={proposal.id} href={`/proposals/${proposal.id}`}>
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-200 hover:scale-[1.02] group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {customer?.name || 'Unnamed Customer'}
                      </CardTitle>
                      <CardDescription className="mt-1 truncate">
                        {customer?.email || 'No email'}
                      </CardDescription>
                    </div>
                    <Badge className={cn("shrink-0 font-medium", getStatusColor(proposal.status))}>
                      {proposal.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {totals?.total && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
                        <p className="text-3xl font-bold text-gray-900">
                          ${totals.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>
                        {new Date(proposal.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                      <span className="truncate ml-2">
                        {proposal.user.email}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {filteredProposals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No proposals match your filters' : 'No proposals yet'}
          </h3>
          <p className="text-gray-500 text-center max-w-md mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
              : 'Get started by creating your first HVAC proposal for a customer.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Link href="/builder">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Proposal
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
