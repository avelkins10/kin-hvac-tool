import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const companyId = searchParams.get('companyId')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    // Company isolation
    if (session.user.role === 'SUPER_ADMIN') {
      if (companyId) {
        where.companyId = companyId
      }
    } else {
      where.companyId = session.user.companyId || undefined
    }

    // User filter - Security: SALES_REP role must only see their own proposals
    if (session.user.role === 'SALES_REP') {
      // Ignore any userId query parameter and force to session user
      if (userId && userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      where.userId = session.user.id
    } else if (userId) {
      // Other roles can filter by userId if provided
      where.userId = userId
    }

    // Status filter
    if (status) {
      where.status = status
    }

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          signatureRequests: {
            select: {
              id: true,
              status: true,
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
          financeApplications: {
            select: {
              id: true,
              status: true,
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.proposal.count({ where }),
    ])

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const {
      customerData,
      homeData,
      hvacData,
      solarData,
      electricalData,
      preferencesData,
      selectedEquipment,
      addOns,
      maintenancePlan,
      incentives,
      paymentMethod,
      financingOption,
      totals,
      nameplateAnalysis,
    } = body

    if (!session.user.companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const proposal = await prisma.proposal.create({
      data: {
        userId: session.user.id,
        companyId: session.user.companyId,
        status: 'DRAFT',
        customerData: customerData || null,
        homeData: homeData || null,
        hvacData: hvacData || null,
        solarData: solarData || null,
        electricalData: electricalData || null,
        preferencesData: preferencesData || null,
        selectedEquipment: selectedEquipment || null,
        addOns: addOns || null,
        maintenancePlan: maintenancePlan || null,
        incentives: incentives || null,
        paymentMethod: paymentMethod || null,
        financingOption: financingOption || null,
        totals: totals || null,
        nameplateAnalysis: nameplateAnalysis || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    // Create initial version
    await prisma.proposalVersion.create({
      data: {
        proposalId: proposal.id,
        versionNumber: 1,
        data: body,
      },
    })

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
