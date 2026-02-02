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

    // Only update fields that are present in the body so we don't overwrite
    // e.g. customerData with null when the client sends a partial payload
    const jsonFields = [
      'customerData',
      'homeData',
      'hvacData',
      'solarData',
      'electricalData',
      'preferencesData',
      'selectedEquipment',
      'addOns',
      'maintenancePlan',
      'incentives',
      'paymentMethod',
      'financingOption',
      'totals',
      'nameplateAnalysis',
    ] as const
    const data: Record<string, unknown> = {}
    for (const key of jsonFields) {
      if (key in body) {
        data[key] = body[key] ?? null
      }
    }

    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireAuth()

    // Only COMPANY_ADMIN and SUPER_ADMIN can delete proposals
    if (session.user.role !== 'COMPANY_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only admins can delete proposals.' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const proposalId = resolvedParams.id

    const existing = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // COMPANY_ADMIN can only delete proposals in their company
    if (session.user.role === 'COMPANY_ADMIN' && existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.proposal.delete({
      where: { id: proposalId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
