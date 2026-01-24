import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import { FinanceProviderFactory } from '@/lib/integrations/finance-factory'
import {
  FinanceError,
  FinanceValidationError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { proposalId, applicationData } = body

    // Add external reference to link back to our proposal
    if (proposalId && !applicationData.externalReference) {
      applicationData.externalReference = proposalId
    }
    if (proposalId && !applicationData.externalReferenceIds) {
      applicationData.externalReferenceIds = [
        { type: 'proposal', id: proposalId },
      ]
    }

    // Validate required fields
    if (!proposalId || typeof proposalId !== 'string' || proposalId.trim() === '') {
      return NextResponse.json(
        { error: 'proposalId is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!applicationData || typeof applicationData !== 'object') {
      return NextResponse.json(
        { error: 'applicationData is required and must be an object' },
        { status: 400 }
      )
    }

    // Verify proposal exists and user has access
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        financeApplications: {
          where: {
            lenderId: 'lightreach',
            status: {
              in: ['PENDING', 'SUBMITTED'],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check access permissions
    if (session.user.role !== 'SUPER_ADMIN' && proposal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check for duplicate pending/submitted applications
    const existingApplication = proposal.financeApplications[0]
    if (existingApplication) {
      const daysSinceCreation = Math.floor(
        (Date.now() - existingApplication.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Allow resubmission if the existing application is older than 7 days
      if (daysSinceCreation < 7) {
        return NextResponse.json(
          {
            error: 'An active finance application already exists for this proposal',
            existingApplicationId: existingApplication.id,
            createdAt: existingApplication.createdAt,
          },
          { status: 409 }
        )
      }
    }

    // Log application submission attempt
    console.log('[Finance] Submitting application:', {
      proposalId,
      userId: session.user.id,
      companyId: session.user.companyId,
      timestamp: new Date().toISOString(),
    })

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

    // Log successful submission
    console.log('[Finance] Application submitted successfully:', {
      applicationId: financeApplication.id,
      externalApplicationId: financeApplication.externalApplicationId,
      status: financeApplication.status,
      proposalId,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(financeApplication, { status: 201 })
  } catch (error) {
    logFinanceError(error, 'apply')

    // Handle finance-specific errors
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

    // Generic error handling
    return NextResponse.json(
      {
        error: formatFinanceError(error),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
