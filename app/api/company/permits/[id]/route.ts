import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const resolvedParams = await Promise.resolve(params)
    const existing = await prisma.permitFee.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!existing || existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const permit = await prisma.permitFee.update({
      where: { id: resolvedParams.id },
      data: body,
    })

    return NextResponse.json(permit)
  } catch (error) {
    console.error('Error updating permit fee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const resolvedParams = await Promise.resolve(params)
    const existing = await prisma.permitFee.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!existing || existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.permitFee.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('Error deleting permit fee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
