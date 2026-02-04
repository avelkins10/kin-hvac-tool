import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { lightReachClient } from '@/lib/integrations/lightreach'
import {
  FinanceError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors'

/**
 * GET /api/finance/lightreach/contract/[accountId]
 * Get current contract for an account.
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
        contract: responseData?.contract || null,
        contractStatus: responseData?.contractStatus || null,
        message: 'Test mode - returning stored contract data',
      })
    }

    // Get contract from LightReach
    const contract = await lightReachClient.getCurrentContract(accountId)

    return NextResponse.json({ contract })
  } catch (error) {
    logFinanceError(error, 'get-contract')

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
 * POST /api/finance/lightreach/contract/[accountId]
 * Send contract to customer for signing.
 *
 * Query params:
 * - action: 'send' (default) or 'void'
 * - contractId: string (required for void action)
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

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'send'
    const contractId = searchParams.get('contractId')

    if (action !== 'send' && action !== 'void') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "send" or "void"' },
        { status: 400 }
      )
    }

    if (action === 'void' && !contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required for void action' },
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

    console.log('[Contract] Action:', {
      accountId,
      action,
      contractId,
      userId: session.user.id,
    })

    // Check if test mode
    if (accountId.startsWith('test_')) {
      if (action === 'send') {
        const mockContractId = `test_contract_${Date.now()}`
        await prisma.financeApplication.update({
          where: { id: application.id },
          data: {
            responseData: {
              ...(application.responseData as object || {}),
              contractStatus: {
                sent: true,
                sentAt: new Date().toISOString(),
              },
              contract: {
                id: mockContractId,
                accountId,
                status: 'sent',
                sentAt: new Date().toISOString(),
              },
            },
          },
        })
        return NextResponse.json({
          success: true,
          contractId: mockContractId,
          message: 'Contract sent successfully (test mode)',
        })
      } else {
        await prisma.financeApplication.update({
          where: { id: application.id },
          data: {
            responseData: {
              ...(application.responseData as object || {}),
              contractStatus: {
                ...((application.responseData as any)?.contractStatus || {}),
                voided: true,
                voidedAt: new Date().toISOString(),
              },
            },
          },
        })
        return NextResponse.json({
          success: true,
          message: 'Contract voided successfully (test mode)',
        })
      }
    }

    // Execute action via LightReach
    if (action === 'send') {
      const result = await lightReachClient.sendContract(accountId)

      // Update application with contract status
      await prisma.financeApplication.update({
        where: { id: application.id },
        data: {
          responseData: {
            ...(application.responseData as object || {}),
            contractId: result.contractId,
            contractSentAt: new Date().toISOString(),
          },
        },
      })

      return NextResponse.json({
        success: true,
        contractId: result.contractId,
        message: 'Contract sent successfully',
      })
    } else {
      await lightReachClient.voidContract(accountId, contractId!)

      // Update application with voided status
      await prisma.financeApplication.update({
        where: { id: application.id },
        data: {
          responseData: {
            ...(application.responseData as object || {}),
            contractVoidedAt: new Date().toISOString(),
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Contract voided successfully',
      })
    }
  } catch (error) {
    logFinanceError(error, 'contract-action')

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
