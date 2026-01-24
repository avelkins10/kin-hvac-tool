"use client"

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { ClientCard } from './ClientCard'

interface Client {
  email: string
  name?: string
  phone?: string
  proposals: any[]
  totalValue: number
  lastProposalDate: string
}

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (!searchTerm) {
      setFilteredClients(clients)
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const filtered = clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone?.toLowerCase().includes(searchLower)
    )
    setFilteredClients(filtered)
  }, [searchTerm, clients])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        setFilteredClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading clients...</div>
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search clients by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'No clients found matching your search.' : 'No clients found.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard key={client.email} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}
