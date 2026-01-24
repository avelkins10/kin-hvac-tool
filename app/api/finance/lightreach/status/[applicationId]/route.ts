import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { FinanceProviderFactory } from '@/lib/integrations/finance-factory'

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const application = await prisma.financeApplication.findUnique({
      where: { id: params.applicationId },
      include: {
        proposal: true,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Check access
    if (session.user.role !== 'SUPER_ADMIN' && application.proposal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch latest status from lender using external application ID
    if (!application.externalApplicationId) {
      return NextResponse.json({ error: 'External application ID not found' }, { status: 400 })
    }

    const provider = FinanceProviderFactory.createProvider(application.lenderId)
    const status = await provider.getApplicationStatus(application.externalApplicationId)

    // Update database with latest status
    const updated = await prisma.financeApplication.update({
      where: { id: params.applicationId },
      data: {
        status: status.status.toUpperCase() as any,
        responseData: status,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error fetching finance application status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
