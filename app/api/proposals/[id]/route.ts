import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireAuth()

    const resolvedParams = await Promise.resolve(params)
    const proposalId = resolvedParams.id

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check access
    if (session.user.role !== 'SUPER_ADMIN' && proposal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Sales reps can only see their own proposals
    if (session.user.role === 'SALES_REP' && proposal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireAuth()

    const resolvedParams = await Promise.resolve(params)
    const proposalId = resolvedParams.id

    const existing = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check access
    if (session.user.role !== 'SUPER_ADMIN' && existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Sales reps can only update their own proposals
    if (session.user.role === 'SALES_REP' && existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent editing finalized proposals (ACCEPTED, REJECTED, EXPIRED)
    const finalizedStatuses = ['ACCEPTED', 'REJECTED', 'EXPIRED']
    if (finalizedStatuses.includes(existing.status)) {
      return NextResponse.json({ 
        error: 'Cannot edit a finalized proposal. Only DRAFT, SENT, and VIEWED proposals can be edited.' 
      }, { status: 400 })
    }

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

    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
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

    // Create new version
    const latestVersion = await prisma.proposalVersion.findFirst({
      where: { proposalId: proposalId },
      orderBy: { versionNumber: 'desc' },
    })

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1

    await prisma.proposalVersion.create({
      data: {
        proposalId: proposalId,
        versionNumber: nextVersionNumber,
        data: body,
      },
    })

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
