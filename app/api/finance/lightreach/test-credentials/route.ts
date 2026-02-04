import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'

/**
 * POST /api/finance/lightreach/test-credentials
 * Test LightReach credentials by attempting to authenticate
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const { email, password, environment } = body

    if (!email || !password) {
      return NextResponse.json(
        { valid: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Determine auth URL based on environment
    const isProduction = environment === 'prod' || environment === 'production'
    const authUrl = isProduction
      ? 'https://palmetto.finance/api/auth/login'
      : 'https://next.palmetto.finance/api/auth/login'

    console.log('[TestCredentials] Testing auth against:', authUrl)

    // Attempt to authenticate with LightReach
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.access_token) {
        return NextResponse.json({
          valid: true,
          message: 'Credentials verified successfully',
        })
      }
    }

    // Try to get error message from response
    let errorMessage = 'Invalid credentials'
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || 'Invalid credentials'
    } catch {
      // Ignore JSON parse errors
    }

    return NextResponse.json({
      valid: false,
      error: errorMessage,
    })
  } catch (error) {
    console.error('[TestCredentials] Error:', error)
    return NextResponse.json(
      {
        valid: false,
        error: 'Failed to test credentials. Please try again.',
      },
      { status: 500 }
    )
  }
}
