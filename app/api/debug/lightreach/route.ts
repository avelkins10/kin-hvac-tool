import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { lightReachClient } from '@/lib/integrations/lightreach'

/**
 * GET /api/debug/lightreach
 * Debug endpoint to test LightReach API connection
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const debugInfo: Record<string, any> = {
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      env: {
        hasEmail: !!process.env.PALMETTO_FINANCE_ACCOUNT_EMAIL,
        hasPassword: !!process.env.PALMETTO_FINANCE_ACCOUNT_PASSWORD,
        environment: process.env.PALMETTO_FINANCE_ENVIRONMENT || 'next (default)',
        testModeEnabled: process.env.ENABLE_FINANCE_TEST_MODE === 'true',
      },
    }

    // Try to get estimated pricing with test data
    try {
      const products = await lightReachClient.getEstimatedPricing(
        'TX', // Use Texas as test state
        15000 // $15k test amount
      )

      debugInfo.apiCall = {
        success: true,
        productsCount: products?.length || 0,
        products: products?.map(p => ({
          productId: p.productId,
          name: p.name,
          type: p.type,
          escalationRate: p.escalationRate,
          monthlyPaymentsCount: p.monthlyPayments?.length || 0,
          firstPayment: p.monthlyPayments?.[0],
        })),
      }
    } catch (apiError: any) {
      debugInfo.apiCall = {
        success: false,
        error: apiError.message,
        code: apiError.code,
        statusCode: apiError.statusCode,
        details: apiError.details,
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
