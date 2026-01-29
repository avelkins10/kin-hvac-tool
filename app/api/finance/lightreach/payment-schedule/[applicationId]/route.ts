import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { FinanceProviderFactory } from '@/lib/integrations/finance-factory'
import {
  FinanceError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const session = await requireAuth()

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

    // Check if payment schedule is available in cached response data
    const responseData = application.responseData as any
    if (responseData?.paymentSchedule) {
      return NextResponse.json({
        paymentSchedule: responseData.paymentSchedule,
        cached: true,
        applicationId: application.id,
      })
    }

    // Fetch payment schedule from lender
    if (!application.externalApplicationId) {
      return NextResponse.json(
        { error: 'External application ID not found' },
        { status: 400 }
      )
    }

    // Payment schedule is typically only available for approved/conditional applications
    if (application.status !== 'APPROVED' && application.status !== 'CONDITIONAL') {
      return NextResponse.json(
        {
          error: 'Payment schedule is only available for approved or conditional applications',
          currentStatus: application.status,
        },
        { status: 400 }
      )
    }

    const provider = FinanceProviderFactory.createProvider(application.lenderId)
    const paymentSchedule = await provider.getPaymentSchedule(application.externalApplicationId)

    // Update response data with payment schedule
    await prisma.financeApplication.update({
      where: { id: params.applicationId },
      data: {
        responseData: {
          ...(responseData || {}),
          paymentSchedule,
          paymentScheduleFetchedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      paymentSchedule,
      cached: false,
      applicationId: application.id,
    })
  } catch (error) {
    logFinanceError(error, 'getPaymentSchedule')

    if (error instanceof FinanceError) {
      return NextResponse.json(
        {
          error: formatFinanceError(error),
          code: error.code,
        },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      {
        error: formatFinanceError(error),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
