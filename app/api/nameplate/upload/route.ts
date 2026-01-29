/**
 * API route to upload nameplate photo to Supabase Storage
 * Called from InteractiveHouseAssessment component
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { uploadNameplatePhoto } from '@/lib/storage/supabase-storage'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session.user.companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const proposalId = formData.get('proposalId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 })
    }

    // Verify proposal exists and user has access
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check access
    if (session.user.role !== 'SUPER_ADMIN' && proposal.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Upload to Supabase Storage
    const { url, path } = await uploadNameplatePhoto(
      file,
      proposalId,
      session.user.companyId
    )

    // Update proposal with nameplate photo URL
    const hvacData = (proposal.hvacData as any) || {}
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        hvacData: {
          ...hvacData,
          nameplatePhotoUrl: url,
          nameplatePhotoPath: path,
        },
      },
    })

    return NextResponse.json({ url, path })
  } catch (error) {
    console.error('Error uploading nameplate photo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload photo' },
      { status: 500 }
    )
  }
}
