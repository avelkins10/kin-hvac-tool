import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'COMPANY_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
