import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireAuth()

    const resolvedParams = await Promise.resolve(params)
    const proposalId = resolvedParams.id

    const existingProposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!existingProposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check access
    if (session.user.role !== 'SUPER_ADMIN') {
      if (existingProposal.companyId !== session.user.companyId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (!session.user.companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    // Create duplicate
    const duplicatedProposal = await prisma.proposal.create({
      data: {
        userId: session.user.id,
        companyId: session.user.companyId,
        status: 'DRAFT',
        customerData: existingProposal.customerData,
        homeData: existingProposal.homeData,
        hvacData: existingProposal.hvacData,
        solarData: existingProposal.solarData,
        electricalData: existingProposal.electricalData,
        preferencesData: existingProposal.preferencesData,
        selectedEquipment: existingProposal.selectedEquipment,
        addOns: existingProposal.addOns,
        maintenancePlan: existingProposal.maintenancePlan,
        incentives: existingProposal.incentives,
        paymentMethod: existingProposal.paymentMethod,
        financingOption: existingProposal.financingOption,
        totals: existingProposal.totals,
        nameplateAnalysis: existingProposal.nameplateAnalysis,
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
        proposalId: duplicatedProposal.id,
        versionNumber: 1,
        data: {
          customerData: existingProposal.customerData,
          homeData: existingProposal.homeData,
          hvacData: existingProposal.hvacData,
          solarData: existingProposal.solarData,
          electricalData: existingProposal.electricalData,
          preferencesData: existingProposal.preferencesData,
          selectedEquipment: existingProposal.selectedEquipment,
          addOns: existingProposal.addOns,
          maintenancePlan: existingProposal.maintenancePlan,
          incentives: existingProposal.incentives,
          paymentMethod: existingProposal.paymentMethod,
          financingOption: existingProposal.financingOption,
          totals: existingProposal.totals,
          nameplateAnalysis: existingProposal.nameplateAnalysis,
        },
      },
    })

    return NextResponse.json(duplicatedProposal, { status: 201 })
  } catch (error) {
    console.error('Error duplicating proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
