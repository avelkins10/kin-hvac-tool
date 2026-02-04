import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { FinanceProviderFactory } from '@/lib/integrations/finance-factory'
import {
  FinanceError,
  FinanceValidationError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors'
import { buildSystemDesignFromProposal } from '@/lib/finance-helpers'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

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

    // Friendly name for Palmetto dashboard (customer name)
    const customerData = proposal.customerData as { name?: string } | undefined
    if (!applicationData.friendlyName && customerData?.name) {
      applicationData.friendlyName = customerData.name
    }
    if (!applicationData.friendlyName && applicationData.firstName != null && applicationData.lastName != null) {
      applicationData.friendlyName = [applicationData.firstName, applicationData.lastName].filter(Boolean).join(' ')
    }

    // Check access permissions
    if (session.user.role !== 'SUPER_ADMIN' && proposal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Per-user sales rep info for LightReach (override env if set)
    let submittingUser: { lightreachSalesRepName?: string | null; lightreachSalesRepEmail?: string | null; lightreachSalesRepPhone?: string | null } | null = null
    try {
      submittingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          lightreachSalesRepName: true,
          lightreachSalesRepEmail: true,
          lightreachSalesRepPhone: true,
        },
      })
    } catch {
      // Schema may not have lightreach columns yet or Prisma client may be stale (e.g. cached build)
      submittingUser = null
    }
    if (submittingUser?.lightreachSalesRepName?.trim()) {
      applicationData.salesRepName = submittingUser.lightreachSalesRepName.trim()
    }
    if (submittingUser?.lightreachSalesRepEmail?.trim()) {
      applicationData.salesRepEmail = submittingUser.lightreachSalesRepEmail.trim()
    }
    if (submittingUser?.lightreachSalesRepPhone?.trim()) {
      applicationData.salesRepPhoneNumber = submittingUser.lightreachSalesRepPhone.trim()
    }

    // Attach system design from proposal so LightReach portal shows home size, equipment, etc.
    const systemDesign = buildSystemDesignFromProposal(proposal)
    if (systemDesign) {
      applicationData.systemDesign = systemDesign
    } else {
      // Require system design for Comfort Plan so LightReach portal is populated
      return NextResponse.json(
        {
          error:
            'Proposal must include home square footage and equipment selection before submitting a Comfort Plan application. Complete Home Details and select equipment in the proposal, then try again.',
          code: 'SYSTEM_DESIGN_REQUIRED',
        },
        { status: 400 }
      )
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

    // Use real LightReach API unless test mode is explicitly enabled.
    const hasCredentials =
      !!process.env.PALMETTO_FINANCE_ACCOUNT_EMAIL && !!process.env.PALMETTO_FINANCE_ACCOUNT_PASSWORD
    const enableTestMode = process.env.ENABLE_FINANCE_TEST_MODE === 'true'

    if (!hasCredentials && !enableTestMode) {
      return NextResponse.json(
        {
          error:
            'LightReach credentials not configured. Set PALMETTO_FINANCE_ACCOUNT_EMAIL and PALMETTO_FINANCE_ACCOUNT_PASSWORD in your environment, or set ENABLE_FINANCE_TEST_MODE=true for mock testing. See LIGHTREACH_FULL_SETUP.md.',
          code: 'CREDENTIALS_REQUIRED',
        },
        { status: 503 }
      )
    }

    let response: any

    if (enableTestMode) {
      // Test mode: Generate mock response based on SSN
      console.log('[Finance] Running in TEST MODE - generating mock response')
      const ssn = applicationData.ssn || ''
      
      // Get Comfort Plan terms from proposal financing option
      const financingOption = proposal.financingOption as any
      const planName = financingOption?.name || ''
      const termMonths = financingOption?.termMonths || 120 // Default to 10 years
      
      // Extract escalator from plan name
      let escalatorRate = 0
      if (planName.includes('1.99%')) {
        escalatorRate = 1.99
      } else if (planName.includes('0.99%')) {
        escalatorRate = 0.99
      } else {
        escalatorRate = 0
      }
      
      // Determine term years
      const termYears = termMonths === 144 ? 12 : 10
      
      // Use Comfort Plan payment factors based on term and escalator
      const paymentFactors: Record<string, number> = {
        '10yr_0%': 0.01546,
        '10yr_0.99%': 0.01487,
        '10yr_1.99%': 0.01416,
        '12yr_0%': 0.01397,
        '12yr_0.99%': 0.01321,
        '12yr_1.99%': 0.01247,
      }
      
      const factorKey = `${termYears}yr_${escalatorRate}%` as keyof typeof paymentFactors
      const paymentFactor = paymentFactors[factorKey] || paymentFactors['10yr_0%']
      
      // Map test SSNs to status (but use Comfort Plan terms for all)
      const statusMap: Record<string, string> = {
        '500101005': 'conditional',
        '500101006': 'conditional',
        '500101007': 'conditional',
        '500101008': 'conditional',
        '500101009': 'conditional',
        '500101010': 'denied',
        '500101011': 'denied',
        '500101015': 'pending',
        '500101016': 'pending',
        '666222525': 'conditional',
        '666822307': 'denied',
        '666381719': 'conditional',
        '666113332': 'conditional',
        '666427102': 'denied',
        '666706006': 'denied',
        '666563316': 'conditional',
        '666386118': 'conditional',
      }
      
      const status = statusMap[ssn] || 'conditional'
      
      // Calculate monthly payment using Comfort Plan factor
      const monthlyPayment = Math.round(systemPrice * paymentFactor * 100) / 100
      
      // Build message based on status
      let message = ''
      if (status === 'denied') {
        message = ssn === '666706006' ? 'Declined - Bankruptcy' : 'Declined - Low credit score'
      } else if (status === 'pending') {
        message = 'Credit frozen - Application pending'
      } else {
        const escalatorText = escalatorRate > 0 
          ? ` (${escalatorRate}% annual escalator)`
          : ' (Fixed monthly payment)'
        message = `Approved with stipulations - ${termYears} Year Comfort Plan${escalatorText}`
      }
      
      const mockResponse = {
        status,
        monthlyPayment,
        totalCost: systemPrice,
        termMonths,
        termYears,
        escalatorRate,
        apr: 0, // Comfort Plans have 0% APR (it's a lease)
        message,
      }

      // Generate a mock application ID
      const mockApplicationId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`

      response = {
        applicationId: mockApplicationId,
        status: mockResponse.status,
        monthlyPayment: mockResponse.monthlyPayment,
        totalCost: mockResponse.totalCost,
        apr: mockResponse.apr,
        term: mockResponse.termMonths,
        termYears: mockResponse.termYears,
        escalatorRate: mockResponse.escalatorRate,
        leaseType: 'Comfort Plan',
        message: mockResponse.message,
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
