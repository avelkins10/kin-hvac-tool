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
    const systemPrice = applicationData?.systemPrice || 0

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

    // Check if we're in test mode (no credentials configured)
    const isTestMode = !process.env.PALMETTO_FINANCE_ACCOUNT_EMAIL || !process.env.PALMETTO_FINANCE_ACCOUNT_PASSWORD
    const enableTestMode = process.env.ENABLE_FINANCE_TEST_MODE === 'true' || isTestMode

    let response: any

    if (enableTestMode) {
      // Test mode: Generate mock response based on SSN
      console.log('[Finance] Running in TEST MODE - generating mock response')
      const ssn = applicationData.ssn || ''
      
      // Map test SSNs to mock responses (monthly payment as percentage of system price)
      const mockResponses: Record<string, any> = {
        '500101005': { status: 'conditional', monthlyPaymentPercent: 0.0167, apr: 4.99, term: 60, message: 'Approved with stipulations (FICO 802)' },
        '500101006': { status: 'conditional', monthlyPaymentPercent: 0.0183, apr: 5.49, term: 60, message: 'Approved with stipulations (FICO 761)' },
        '500101007': { status: 'conditional', monthlyPaymentPercent: 0.0200, apr: 6.99, term: 60, message: 'Approved with stipulations (FICO 724) - Limited payment options' },
        '500101008': { status: 'conditional', monthlyPaymentPercent: 0.0213, apr: 7.49, term: 60, message: 'Approved with stipulations (FICO 703) - Limited payment options' },
        '500101009': { status: 'conditional', monthlyPaymentPercent: 0.0233, apr: 8.99, term: 60, message: 'Approved with stipulations (FICO 662) - Limited payment options' },
        '500101010': { status: 'denied', message: 'Declined - Low credit score (550)' },
        '500101011': { status: 'denied', message: 'Declined - Low credit score (500)' },
        '500101015': { status: 'pending', message: 'Credit frozen - Application pending' },
        '500101016': { status: 'pending', message: 'Credit frozen - Application pending' },
        '666222525': { status: 'conditional', monthlyPaymentPercent: 0.0187, apr: 5.99, term: 60, message: 'Approved with stipulations (FICO 671)' },
        '666822307': { status: 'denied', message: 'Declined - Low credit score (593)' },
        '666381719': { status: 'conditional', monthlyPaymentPercent: 0.0180, apr: 5.79, term: 60, message: 'Approved with stipulations (FICO 675)' },
        '666113332': { status: 'conditional', monthlyPaymentPercent: 0.0173, apr: 5.29, term: 60, message: 'Approved with stipulations (FICO 702)' },
        '666427102': { status: 'denied', message: 'Declined - Low credit score (383)' },
        '666706006': { status: 'denied', message: 'Declined - Bankruptcy' },
        '666563316': { status: 'conditional', monthlyPaymentPercent: 0.0160, apr: 4.49, term: 60, message: 'Approved with stipulations (FICO 750)' },
        '666386118': { status: 'conditional', monthlyPaymentPercent: 0.0157, apr: 4.29, term: 60, message: 'Approved with stipulations (FICO 757)' },
      }

      // Default to approved if SSN not in test list
      const mockResponse = mockResponses[ssn] || {
        status: 'conditional',
        monthlyPaymentPercent: 0.0167, // ~1.67% of system price
        apr: 5.99,
        term: 60,
        message: 'Test mode - Application approved (default response)',
      }

      // Calculate monthly payment based on system price
      const monthlyPayment = mockResponse.monthlyPaymentPercent
        ? Math.round(systemPrice * mockResponse.monthlyPaymentPercent)
        : Math.round(systemPrice / (mockResponse.term || 60))

      // Generate a mock application ID
      const mockApplicationId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`

      response = {
        applicationId: mockApplicationId,
        status: mockResponse.status,
        monthlyPayment: monthlyPayment,
        totalCost: systemPrice,
        apr: mockResponse.apr,
        term: mockResponse.term || 60,
        message: mockResponse.message || 'Test mode response',
      }

      console.log('[Finance] Test mode response:', response)
    } else {
      // Production mode: Use real LightReach API
      const provider = FinanceProviderFactory.createProvider('lightreach')
      response = await provider.createApplication(applicationData)
    }

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
