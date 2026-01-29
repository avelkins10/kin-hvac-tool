import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const rates = await prisma.laborRate.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching labor rates:', error)
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
    const { name, rate } = body

    if (!name || rate === undefined) {
      return NextResponse.json({ error: 'Name and rate are required' }, { status: 400 })
    }

    const laborRate = await prisma.laborRate.create({
      data: {
        companyId: session.user.companyId,
        name,
        rate,
      },
    })

    return NextResponse.json(laborRate, { status: 201 })
  } catch (error) {
    console.error('Error creating labor rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
