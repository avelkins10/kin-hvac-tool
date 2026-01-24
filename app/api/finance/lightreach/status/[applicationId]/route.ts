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

    let application
    try {
      application = await prisma.financeApplication.findUnique({
        where: { id: params.applicationId },
        include: {
          proposal: true,
        },
      })
    } catch (dbError: any) {
      // Handle case where externalApplicationId column doesn't exist yet
      if (dbError?.message?.includes('externalApplicationId') || dbError?.code === 'P2021') {
        console.warn('[Finance] externalApplicationId column may not exist yet, trying alternative query')
        // Try querying without the problematic field by selecting specific fields
        application = await prisma.$queryRaw`
          SELECT 
            id, "proposalId", "lenderId", status, "applicationData", "responseData", 
            "createdAt", "updatedAt"
          FROM "FinanceApplication"
          WHERE id = ${params.applicationId}
        ` as any
        
        if (application && Array.isArray(application) && application.length > 0) {
          application = application[0]
          // Fetch proposal separately
          const proposal = await prisma.proposal.findUnique({
            where: { id: (application as any).proposalId },
          })
          ;(application as any).proposal = proposal
          ;(application as any).externalApplicationId = null // Column doesn't exist
        } else {
          application = null
        }
      } else {
        throw dbError
      }
    }

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

    // For test mode applications or if externalApplicationId is missing, return cached data
    if (!application.externalApplicationId) {
      // Check if we have response data (from test mode)
      if (application.responseData) {
        const cachedData = application.responseData as any
        return NextResponse.json({
          ...application,
          cached: true,
          cacheAge: Math.floor(timeSinceUpdate / 1000),
          lastUpdated: application.updatedAt,
          testMode: true,
        })
      }
      
      // No data available
      return NextResponse.json(
        { error: 'External application ID not found and no cached data available' },
        { status: 400 }
      )
    }

    // Check if we're in test mode (no credentials configured)
    const isTestMode = !process.env.PALMETTO_FINANCE_ACCOUNT_EMAIL || !process.env.PALMETTO_FINANCE_ACCOUNT_PASSWORD
    
    // If test mode and we have cached data, return it without API call
    if (isTestMode && application.responseData) {
      const cachedData = application.responseData as any
      return NextResponse.json({
        ...application,
        cached: true,
        cacheAge: Math.floor(timeSinceUpdate / 1000),
        lastUpdated: application.updatedAt,
        testMode: true,
      })
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
