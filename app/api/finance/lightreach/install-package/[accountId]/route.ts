import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { lightReachClient, HVACInstallPackage } from '@/lib/integrations/lightreach'
import {
  FinanceError,
  FinanceValidationError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors'

/**
 * POST /api/finance/lightreach/install-package/[accountId]
 * Save or submit HVAC install package
 *
 * Query params:
 * - action: 'save' (default) or 'submit'
 *
 * Body: HVACInstallPackage
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

    // Get action from query params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'save'

    if (action !== 'save' && action !== 'submit') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "save" or "submit"' },
        { status: 400 }
      )
    }

    // Parse body
    const body = await request.json()
    const installPackage: HVACInstallPackage = body

    // Find the finance application by external account ID
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

    // Check if test mode - simulate success
    if (accountId.startsWith('test_')) {
      console.log(`[InstallPackage] Test mode - simulating ${action}:`, { accountId })
      return NextResponse.json({
        success: true,
        action,
        accountId,
        message: `Install package ${action === 'submit' ? 'submitted' : 'saved'} successfully (test mode)`,
      })
    }

    // Call LightReach API
    if (action === 'submit') {
      await lightReachClient.submitInstallPackage(accountId, installPackage)
    } else {
      await lightReachClient.saveInstallPackage(accountId, installPackage)
    }

    // Update application with install package data
    await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        responseData: {
          ...(application.responseData as object || {}),
          installPackage: {
            action,
            submittedAt: action === 'submit' ? new Date().toISOString() : undefined,
            savedAt: new Date().toISOString(),
          },
        },
      },
    })

    console.log(`[InstallPackage] ${action} successful:`, { accountId })

    return NextResponse.json({
      success: true,
      action,
      accountId,
      message: `Install package ${action === 'submit' ? 'submitted' : 'saved'} successfully`,
    })
  } catch (error) {
    logFinanceError(error, 'install-package')

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
 * GET /api/finance/lightreach/install-package/[accountId]
 * Get install package flags/status
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
      return NextResponse.json({
        flags: [],
        message: 'Test mode - no flags available',
      })
    }

    // Get flags from LightReach
    const flags = await lightReachClient.getInstallPackageFlags(accountId)

    return NextResponse.json({ flags })
  } catch (error) {
    logFinanceError(error, 'install-package-flags')

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
