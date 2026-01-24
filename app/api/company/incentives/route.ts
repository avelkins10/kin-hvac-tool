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

    const incentives = await prisma.incentive.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(incentives)
  } catch (error) {
    console.error('Error fetching incentives:', error)
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
    const { name, amount, type, description } = body

    if (!name || amount === undefined) {
      return NextResponse.json({ error: 'Name and amount are required' }, { status: 400 })
    }

    const incentive = await prisma.incentive.create({
      data: {
        companyId: session.user.companyId,
        name,
        amount,
        type: type || null,
        description: description || null,
      },
    })

    return NextResponse.json(incentive, { status: 201 })
  } catch (error) {
    console.error('Error creating incentive:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
