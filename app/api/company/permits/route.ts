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

    const permits = await prisma.permitFee.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(permits)
  } catch (error) {
    console.error('Error fetching permit fees:', error)
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
    const { name, cost } = body

    if (!name || cost === undefined) {
      return NextResponse.json({ error: 'Name and cost are required' }, { status: 400 })
    }

    const permit = await prisma.permitFee.create({
      data: {
        companyId: session.user.companyId,
        name,
        cost,
      },
    })

    return NextResponse.json(permit, { status: 201 })
  } catch (error) {
    console.error('Error creating permit fee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
