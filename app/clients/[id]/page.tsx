import { requireAuth } from '@/lib/auth-helpers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { ClientProposals } from '@/components/clients/ClientProposals'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Plus } from 'lucide-react'
import Link from 'next/link'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

async function getClientData(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return null
  }

  // Decode the email (id is URL-encoded email)
  const email = decodeURIComponent(id)

  const where: any = {}

  // Company isolation
  if (session.user.role === 'SUPER_ADMIN') {
    // Super admin can see all
  } else {
    where.companyId = session.user.companyId
  }

  // User filter - Sales reps only see their own proposals
  if (session.user.role === 'SALES_REP') {
    where.userId = session.user.id
  }

  // Get all proposals and filter by email
  const allProposals = await prisma.proposal.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Filter proposals by customer email
  const proposals = allProposals.filter((proposal) => {
    const customerData = proposal.customerData as any
    return customerData?.email?.toLowerCase() === email.toLowerCase()
  })

  if (proposals.length === 0) {
    return null
  }

  // Extract client info from first proposal
  const firstProposal = proposals[0]
  const customerData = firstProposal.customerData as any

  // Calculate totals
  let totalValue = 0
  proposals.forEach((proposal) => {
    const totals = proposal.totals as any
    if (totals?.total) {
      totalValue += totals.total
    }
  })

  return {
    client: {
      email: customerData?.email || email,
      name: customerData?.name,
      phone: customerData?.phone,
      address: customerData?.address,
      city: customerData?.city,
      state: customerData?.state,
      zip: customerData?.zip,
    },
    proposals,
    totalValue,
    proposalCount: proposals.length,
  }
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params
  const data = await getClientData(id)

  if (!data) {
    return (
      <AuthenticatedLayout>
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Client Not Found</h1>
          <p className="text-gray-500">The client you're looking for doesn't exist.</p>
          <Link href="/clients" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Clients
          </Link>
        </div>
      </AuthenticatedLayout>
    )
  }

  const { client, proposals, totalValue, proposalCount } = data

  return (
    <AuthenticatedLayout>
      <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.name || 'Unnamed Customer'}</h1>
          <p className="text-gray-500 mt-1">{client.email}</p>
        </div>
        <Link href="/builder">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Proposal
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{client.phone}</span>
              </div>
            )}
            {(client.address || client.city || client.state || client.zip) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  {client.address && <p>{client.address}</p>}
                  {(client.city || client.state || client.zip) && (
                    <p>
                      {[client.city, client.state, client.zip].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Proposals</p>
              <p className="text-2xl font-bold">{proposalCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ClientProposals proposals={proposals} clientEmail={client.email} />
      </div>
    </AuthenticatedLayout>
  )
}
