import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { FinanceProviderFactory } from '@/lib/integrations/finance-factory'
import {
  FinanceError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors'

// Cache duration: 5 minutes (300000 ms)
const CACHE_DURATION_MS = 5 * 60 * 1000

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for force refresh parameter
    const searchParams = request.nextUrl.searchParams
    const forceRefresh = searchParams.get('refresh') === 'true'

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

    // Check if we should use cached data
    const now = Date.now()
    const lastUpdate = application.updatedAt.getTime()
    const timeSinceUpdate = now - lastUpdate
    const useCache = !forceRefresh && timeSinceUpdate < CACHE_DURATION_MS

    // If cache is valid and not forcing refresh, return cached data
    if (useCache && application.responseData) {
      const cachedData = application.responseData as any
      return NextResponse.json({
        ...application,
        cached: true,
        cacheAge: Math.floor(timeSinceUpdate / 1000), // seconds
        lastUpdated: application.updatedAt,
      })
    }

    // Fetch latest status from lender using external application ID
    if (!application.externalApplicationId) {
      return NextResponse.json(
        { error: 'External application ID not found' },
        { status: 400 }
      )
    }

    // Fetch payment schedule if available
    let paymentSchedule = null
    try {
      const provider = FinanceProviderFactory.createProvider(application.lenderId)
      const status = await provider.getApplicationStatus(application.externalApplicationId)

      // Try to get payment schedule (may not be available for all statuses)
      if (status.status === 'approved' || status.status === 'conditional') {
        try {
          paymentSchedule = await provider.getPaymentSchedule(application.externalApplicationId)
        } catch (scheduleError) {
          // Payment schedule not available is not a critical error
          console.warn('[Finance] Could not fetch payment schedule:', scheduleError)
        }
      }

      // Update database with latest status
      const updated = await prisma.financeApplication.update({
        where: { id: params.applicationId },
        data: {
          status: status.status.toUpperCase() as any,
          responseData: {
            ...status,
            paymentSchedule,
            lastFetched: new Date().toISOString(),
          },
        },
      })

      return NextResponse.json({
        ...updated,
        cached: false,
        lastUpdated: updated.updatedAt,
      })
    } catch (error) {
      // If API call fails but we have cached data, return that
      if (application.responseData && !forceRefresh) {
        logFinanceError(error, 'getStatus')
        const cachedData = application.responseData as any
        return NextResponse.json({
          ...application,
          cached: true,
          cacheAge: Math.floor(timeSinceUpdate / 1000),
          lastUpdated: application.updatedAt,
          warning: 'Could not fetch latest status, showing cached data',
        })
      }

      // No cache available, return error
      throw error
    }
  } catch (error) {
    logFinanceError(error, 'getStatus')

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
