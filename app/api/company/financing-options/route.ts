import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const options = await prisma.financingOption.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(options)
  } catch (error) {
    console.error('Error fetching financing options:', error)
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
    const { name, type, terms, apr } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    const option = await prisma.financingOption.create({
      data: {
        companyId: session.user.companyId,
        name,
        type,
        terms: terms || null,
        apr: apr || null,
      },
    })

    return NextResponse.json(option, { status: 201 })
  } catch (error) {
    console.error('Error creating financing option:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
