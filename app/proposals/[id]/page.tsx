import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth-helpers'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProposalDetailPage({ params }: PageProps) {
  await requireAuth()
  const { id } = await params
  
  // Redirect to the view page
  redirect(`/proposals/${id}/view`)
}
