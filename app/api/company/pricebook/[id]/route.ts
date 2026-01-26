import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'COMPANY_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const existing = await prisma.priceBookUnit.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!existing || existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { brand, model, tonnage, tier, baseCost } = body

    const unit = await prisma.priceBookUnit.update({
      where: { id: resolvedParams.id },
      data: {
        ...(brand !== undefined && { brand }),
        ...(model !== undefined && { model }),
        ...(tonnage !== undefined && { tonnage: tonnage || null }),
        ...(tier !== undefined && { tier: tier || null }),
        ...(baseCost !== undefined && { baseCost }),
      },
    })

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error updating pricebook unit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'COMPANY_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const existing = await prisma.priceBookUnit.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!existing || existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.priceBookUnit.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Error deleting pricebook unit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
