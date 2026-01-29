import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { validatePasswordStrength } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])

    const body = await request.json()
    const { email, password, role } = body

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Users can only update users in their company
    if (session.user.companyId !== existingUser.companyId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (password) {
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
      }
      // Update password in Supabase Auth
      const supabase = await createClient()
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.supabaseUserId || '',
        { password: password.trim() }
      )
      if (updateError) {
        console.error('Error updating password in Supabase Auth:', updateError)
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
      }
      // Note: We don't store password in User table anymore (Supabase Auth handles it)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN'])

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Users can only delete users in their company
    if (session.user.companyId !== existingUser.companyId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent self-deletion
    if (session.user.id === params.id) {
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
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
