import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { validatePasswordStrength } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        lightreachSalesRepName: true,
        lightreachSalesRepEmail: true,
        lightreachSalesRepPhone: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Users can only view users in their company
    if (session.user.companyId !== user.companyId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth()

    const body = await request.json()
    const {
      email,
      password,
      role,
      lightreachSalesRepName,
      lightreachSalesRepEmail,
      lightreachSalesRepPhone,
    } = body

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isSelf = session.user.id === id
    const isAdmin = session.user.role === 'COMPANY_ADMIN' || session.user.role === 'SUPER_ADMIN'
    const canEditOther = isAdmin && (session.user.companyId === existingUser.companyId || session.user.role === 'SUPER_ADMIN')

    // Self can update own LightReach fields only; admins can update others (email, role, password) and LightReach
    if (!isSelf && !canEditOther) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}

    // LightReach sales rep (self or admin)
    if (lightreachSalesRepName !== undefined) updateData.lightreachSalesRepName = lightreachSalesRepName === '' ? null : lightreachSalesRepName
    if (lightreachSalesRepEmail !== undefined) updateData.lightreachSalesRepEmail = lightreachSalesRepEmail === '' ? null : lightreachSalesRepEmail
    if (lightreachSalesRepPhone !== undefined) updateData.lightreachSalesRepPhone = lightreachSalesRepPhone === '' ? null : lightreachSalesRepPhone

    // Admin editing another user: allow email, role, password
    if (!isSelf && canEditOther) {
      if (email) updateData.email = email
      if (role) updateData.role = role
      if (password) {
        const passwordValidation = validatePasswordStrength(password)
        if (!passwordValidation.valid) {
          return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
        }
        const supabase = await createClient()
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.supabaseUserId || '',
          { password: password.trim() }
        )
        if (updateError) {
          console.error('Error updating password in Supabase Auth:', updateError)
          return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
        }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
        lightreachSalesRepName: true,
        lightreachSalesRepEmail: true,
        lightreachSalesRepPhone: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Users can only delete users in their company
    if (session.user.companyId !== existingUser.companyId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete from Supabase Auth first
    if (existingUser.supabaseUserId) {
      const supabase = await createClient()
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.supabaseUserId)
      if (deleteError) {
        console.error('Error deleting user from Supabase Auth:', deleteError)
        // Continue with database deletion even if Supabase Auth deletion fails
      }
    }

    // Delete User record from database
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
