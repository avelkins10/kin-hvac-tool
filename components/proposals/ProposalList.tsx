"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'

interface Proposal {
  id: string
  status: string
  customerData: any
  totals: any
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

  useEffect(() => {
    fetchProposals()
  }, [statusFilter, page])

  const fetchProposals = async () => {
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
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProposals = proposals.filter((proposal) => {
    if (!searchTerm) return true
    const customer = proposal.customerData as any
    const searchLower = searchTerm.toLowerCase()
    return (
      customer?.name?.toLowerCase().includes(searchLower) ||
      customer?.email?.toLowerCase().includes(searchLower) ||
      proposal.id.toLowerCase().includes(searchLower)
    )
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-500'
      case 'SENT':
        return 'bg-blue-500'
      case 'VIEWED':
        return 'bg-yellow-500'
      case 'ACCEPTED':
        return 'bg-green-500'
      case 'REJECTED':
        return 'bg-red-500'
      case 'EXPIRED':
        return 'bg-gray-400'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return <div className="p-8">Loading proposals...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Proposals</h1>
        <div className="flex gap-2">
          <Link href="/proposals/pipeline">
            <Button variant="outline">
              Pipeline View
            </Button>
          </Link>
          <Link href="/builder">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
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
          const customer = proposal.customerData as any
          const totals = proposal.totals as any

          return (
            <Link key={proposal.id} href={`/proposals/${proposal.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {customer?.name || 'Unnamed Customer'}
                    </CardTitle>
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status}
                    </Badge>
                  </div>
                  <CardDescription>{customer?.email || 'No email'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {totals?.total && (
                      <p className="text-2xl font-bold">
                        ${totals.total.toFixed(2)}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Created: {new Date(proposal.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      By: {proposal.user.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {filteredProposals.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No proposals found. Create your first proposal to get started.
        </div>
      )}
    </div>
  )
}
