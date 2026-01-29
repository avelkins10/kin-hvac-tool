import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const addons = await prisma.addOn.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(addons)
  } catch (error) {
    console.error('Error fetching addons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const body = await request.json()
    const { name, baseCost, marginType, marginAmount } = body

    if (!name || baseCost === undefined) {
      return NextResponse.json({ error: 'Name and baseCost are required' }, { status: 400 })
    }

    const addon = await prisma.addOn.create({
      data: {
        companyId: session.user.companyId,
        name,
        baseCost,
        marginType: marginType || null,
        marginAmount: marginAmount || null,
      },
    })

    return NextResponse.json(addon, { status: 201 })
  } catch (error) {
    console.error('Error creating addon:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
