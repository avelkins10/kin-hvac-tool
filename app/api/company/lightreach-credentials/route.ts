import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

/**
 * POST /api/company/lightreach-credentials
 * Save LightReach credentials for the company
 *
 * Note: In production, these should be encrypted before storage.
 * For now, we're storing them in the company settings JSON field.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Check if user has admin access
    if (session.user.role !== 'COMPANY_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, environment } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get current company settings
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { settings: true },
    })

    const currentSettings = (company?.settings as Record<string, any>) || {}

    // Update settings with LightReach credentials
    // Note: In production, encrypt the password before storing
    const updatedSettings = {
      ...currentSettings,
      lightreach: {
        email,
        password, // TODO: Encrypt this in production
        environment: environment || 'next',
        configured: true,
        updatedAt: new Date().toISOString(),
      },
    }

    // Save to database
    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        settings: updatedSettings,
      },
    })

    console.log('[LightReachCredentials] Saved credentials for company:', session.user.companyId)

    return NextResponse.json({
      success: true,
      message: 'Credentials saved successfully',
    })
  } catch (error) {
    console.error('[LightReachCredentials] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/company/lightreach-credentials
 * Check if LightReach credentials are configured (doesn't return actual credentials)
 */
export async function GET() {
  try {
    const session = await requireAuth()

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { settings: true },
    })

    const settings = (company?.settings as Record<string, any>) || {}
    const lightreach = settings.lightreach || {}

    return NextResponse.json({
      configured: !!lightreach.configured,
      email: lightreach.email || null,
      environment: lightreach.environment || 'next',
    })
  } catch (error) {
    console.error('[LightReachCredentials] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check credentials' },
      { status: 500 }
    )
  }
}
