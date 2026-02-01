/**
 * GET /api/storage/signed-url?bucket=...&path=...
 * Returns a short-lived signed URL for a private storage object.
 * Validates that the path's first segment equals the authenticated user's companyId.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import {
  getSignedUrl,
  STORAGE_BUCKETS,
  type StorageBucket,
} from '@/lib/storage/supabase-storage'

const ALLOWED_BUCKETS: StorageBucket[] = [
  STORAGE_BUCKETS.NAMEPLATES,
  STORAGE_BUCKETS.PROPOSALS,
  STORAGE_BUCKETS.SIGNED_DOCS,
  STORAGE_BUCKETS.AGREEMENTS,
]

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const companyId = session.user.companyId
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket') as StorageBucket | null
    const path = searchParams.get('path')

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Query params bucket and path are required' },
        { status: 400 }
      )
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    const firstSegment = path.split('/')[0]
    if (firstSegment !== companyId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = await getSignedUrl(bucket, path)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error creating signed URL:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create signed URL' },
      { status: 500 }
    )
  }
}
