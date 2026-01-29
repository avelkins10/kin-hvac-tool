import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const units = await prisma.priceBookUnit.findMany({
      where: { companyId: session.user.companyId },
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    })

    return NextResponse.json(units)
  } catch (error) {
    console.error('Error fetching pricebook:', error)
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
    
    // Support bulk update
    if (Array.isArray(body)) {
      const results = await Promise.all(
        body.map((unit) =>
          prisma.priceBookUnit.create({
            data: {
              companyId: session.user.companyId!,
              brand: unit.brand,
              model: unit.model,
              tonnage: unit.tonnage || null,
              tier: unit.tier || null,
              baseCost: unit.baseCost,
            },
          })
        )
      )
      return NextResponse.json(results, { status: 201 })
    }

    // Single create
    const { brand, model, tonnage, tier, baseCost } = body

    if (!brand || !model || baseCost === undefined) {
      return NextResponse.json({ error: 'Brand, model, and baseCost are required' }, { status: 400 })
    }

    const unit = await prisma.priceBookUnit.create({
      data: {
        companyId: session.user.companyId,
        brand,
        model,
        tonnage: tonnage || null,
        tier: tier || null,
        baseCost,
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error('Error creating pricebook unit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
