import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { FinanceProviderFactory } from '@/lib/integrations/finance-factory'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { proposalId, applicationData } = body

    if (!proposalId || !applicationData) {
      return NextResponse.json({ error: 'proposalId and applicationData are required' }, { status: 400 })
    }

    // Verify proposal exists and user has access
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && proposal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create finance application via LightReach
    const provider = FinanceProviderFactory.createProvider('lightreach')
    const response = await provider.createApplication(applicationData)

    // Save application to database with external application ID
    const financeApplication = await prisma.financeApplication.create({
      data: {
        proposalId,
        lenderId: 'lightreach',
        externalApplicationId: response.applicationId,
        status: response.status.toUpperCase() as any,
        applicationData,
        responseData: response,
      },
    })

    return NextResponse.json(financeApplication, { status: 201 })
  } catch (error) {
    console.error('Error submitting finance application:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
