import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { lightReachClient } from '@/lib/integrations/lightreach'
import {
  FinanceError,
  FinanceValidationError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors'

/**
 * GET /api/finance/lightreach/quote/[accountId]
 * Get all HVAC quotes for an account.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const session = await requireAuth()
    const { accountId } = params

    if (!accountId || accountId.trim() === '') {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Find the finance application
    const application = await prisma.financeApplication.findFirst({
      where: {
        externalApplicationId: accountId,
        lenderId: 'lightreach',
      },
      include: {
        proposal: true,
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Finance application not found for this account ID' },
        { status: 404 }
      )
    }

    // Verify user has access
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      application.proposal.companyId !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if test mode
    if (accountId.startsWith('test_')) {
      const responseData = application.responseData as any
      return NextResponse.json({
        quotes: responseData?.quotes || [],
        message: 'Test mode - returning stored quotes',
      })
    }

    // Get quotes from LightReach
    const quotes = await lightReachClient.getQuotes(accountId)

    return NextResponse.json({ quotes })
  } catch (error) {
    logFinanceError(error, 'get-quotes')

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

/**
 * POST /api/finance/lightreach/quote/[accountId]
 * Create a new HVAC quote.
 *
 * Body:
 * - productId: string (from pricing response)
 * - totalFinancedAmount: number
 * - externalReference?: string (e.g., proposal ID)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const session = await requireAuth()
    const { accountId } = params

    if (!accountId || accountId.trim() === '') {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { productId, totalFinancedAmount, externalReference } = body

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    if (typeof totalFinancedAmount !== 'number' || totalFinancedAmount <= 0) {
      return NextResponse.json(
        { error: 'totalFinancedAmount must be a positive number' },
        { status: 400 }
      )
    }

    // Find the finance application
    const application = await prisma.financeApplication.findFirst({
      where: {
        externalApplicationId: accountId,
        lenderId: 'lightreach',
      },
      include: {
        proposal: true,
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Finance application not found for this account ID' },
        { status: 404 }
      )
    }

    // Verify user has access
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      application.proposal.companyId !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('[Quote] Creating quote:', {
      accountId,
      productId,
      totalFinancedAmount,
      userId: session.user.id,
    })

    // Check if test mode
    if (accountId.startsWith('test_')) {
      const mockQuote = {
        id: `test_quote_${Date.now()}`,
        accountId,
        productId,
        totalSystemCost: totalFinancedAmount,
        externalReference,
        type: 'lease',
        status: 'active',
        productName: 'Test Comfort Plan',
        escalationRate: 0,
        systemPricingDetails: [
          { year: 1, monthlyPayment: totalFinancedAmount * 0.0155, yearlyCost: totalFinancedAmount * 0.0155 * 12 },
        ],
        totalAmountPaid: totalFinancedAmount * 0.0155 * 120,
      }

      // Store quote in application data
      await prisma.financeApplication.update({
        where: { id: application.id },
        data: {
          responseData: {
            ...(application.responseData as object || {}),
            quotes: [...((application.responseData as any)?.quotes || []), mockQuote],
            quoteId: mockQuote.id,
          },
        },
      })

      return NextResponse.json({ quote: mockQuote })
    }

    // Create quote via LightReach
    const quote = await lightReachClient.createQuote(
      accountId,
      productId,
      totalFinancedAmount,
      externalReference || application.proposal.id
    )

    // Store quote ID in application data
    await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        responseData: {
          ...(application.responseData as object || {}),
          quoteId: quote.id,
          quoteCreatedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({ quote })
  } catch (error) {
    logFinanceError(error, 'create-quote')

    if (error instanceof FinanceValidationError) {
      return NextResponse.json(
        {
          error: formatFinanceError(error),
          field: error.field,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

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

/**
 * DELETE /api/finance/lightreach/quote/[accountId]
 * Void a quote.
 *
 * Query params:
 * - quoteId: string (required)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const session = await requireAuth()
    const { accountId } = params

    const { searchParams } = new URL(request.url)
    const quoteId = searchParams.get('quoteId')

    if (!accountId || !quoteId) {
      return NextResponse.json(
        { error: 'Account ID and Quote ID are required' },
        { status: 400 }
      )
    }

    // Find the finance application
    const application = await prisma.financeApplication.findFirst({
      where: {
        externalApplicationId: accountId,
        lenderId: 'lightreach',
      },
      include: {
        proposal: true,
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Finance application not found for this account ID' },
        { status: 404 }
      )
    }

    // Verify user has access
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      application.proposal.companyId !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('[Quote] Voiding quote:', {
      accountId,
      quoteId,
      userId: session.user.id,
    })

    // Check if test mode
    if (accountId.startsWith('test_')) {
      return NextResponse.json({
        success: true,
        message: 'Quote voided successfully (test mode)',
      })
    }

    // Void quote via LightReach
    await lightReachClient.voidQuote(accountId, quoteId)

    // Update application data
    await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        responseData: {
          ...(application.responseData as object || {}),
          quoteVoidedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Quote voided successfully',
    })
  } catch (error) {
    logFinanceError(error, 'void-quote')

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
