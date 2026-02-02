import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { lightReachClient } from '@/lib/integrations/lightreach'
import {
  FinanceError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> | { applicationId: string } }
) {
  try {
    const session = await requireAuth()
    const resolvedParams = await Promise.resolve(params)
    const applicationId = resolvedParams.applicationId

    const application = await prisma.financeApplication.findUnique({
      where: { id: applicationId },
      include: { proposal: true },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && application.proposal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const externalId = application.externalApplicationId
    if (!externalId || externalId.startsWith('test_')) {
      return NextResponse.json(
        { error: 'Stipulations only available for real LightReach applications' },
        { status: 400 }
      )
    }

    const stipulations = await lightReachClient.getStipulations(externalId)
    return NextResponse.json(stipulations)
  } catch (error) {
    logFinanceError(error, 'getStipulations')

    if (error instanceof FinanceError) {
      return NextResponse.json(
        { error: formatFinanceError(error), code: (error as any).code },
        { status: (error as any).statusCode ?? 500 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get stipulations' },
      { status: 500 }
    )
  }
}
