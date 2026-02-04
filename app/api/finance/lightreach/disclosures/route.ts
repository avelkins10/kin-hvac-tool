import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { lightReachClient } from '@/lib/integrations/lightreach'
import {
  FinanceError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors'

// Cache for disclosures (refresh every 24 hours)
let disclosureCache: { data: any[]; timestamp: number } | null = null
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * GET /api/finance/lightreach/disclosures
 * Get credit disclosures for display to customers.
 *
 * Query params:
 * - type: 'creditApplication' | 'prequalification' | 'txtMessageNotifications' | 'termsAndConditions' (optional)
 * - language: 'English' | 'Spanish' (optional, default: English)
 * - refresh: boolean (optional, force refresh cache)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const disclosureType = searchParams.get('type') as
      | 'creditApplication'
      | 'prequalification'
      | 'txtMessageNotifications'
      | 'termsAndConditions'
      | null
    const language = searchParams.get('language') || 'English'
    const forceRefresh = searchParams.get('refresh') === 'true'

    console.log('[Disclosures] Getting disclosures:', {
      disclosureType: disclosureType || 'all',
      language,
      forceRefresh,
      userId: session.user.id,
    })

    // Check if test mode
    const enableTestMode = process.env.ENABLE_FINANCE_TEST_MODE === 'true'
    const hasCredentials =
      !!process.env.PALMETTO_FINANCE_ACCOUNT_EMAIL &&
      !!process.env.PALMETTO_FINANCE_ACCOUNT_PASSWORD

    if (!hasCredentials && !enableTestMode) {
      return NextResponse.json(
        {
          error: 'LightReach credentials not configured',
          code: 'CREDENTIALS_REQUIRED',
        },
        { status: 503 }
      )
    }

    if (enableTestMode && !hasCredentials) {
      // Return mock disclosures in test mode
      const mockDisclosures = getMockDisclosures(disclosureType, language)
      return NextResponse.json({
        disclosures: mockDisclosures,
        cached: false,
      })
    }

    // Check cache (unless force refresh or filtering by type)
    if (!forceRefresh && !disclosureType && disclosureCache && Date.now() - disclosureCache.timestamp < CACHE_TTL) {
      const filtered = disclosureCache.data.filter((d) => d.language === language)
      return NextResponse.json({
        disclosures: filtered,
        cached: true,
        cacheAge: Math.floor((Date.now() - disclosureCache.timestamp) / 1000),
      })
    }

    // Get disclosures from LightReach
    const disclosures = await lightReachClient.getDisclosures(disclosureType || undefined, language)

    // Cache if fetching all types
    if (!disclosureType) {
      disclosureCache = { data: disclosures, timestamp: Date.now() }
    }

    return NextResponse.json({
      disclosures,
      cached: false,
    })
  } catch (error) {
    logFinanceError(error, 'disclosures')

    if (error instanceof FinanceError) {
      return NextResponse.json(
        {
          error: formatFinanceError(error),
          code: error.code,
        },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      {
        error: formatFinanceError(error),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate mock disclosures for test mode
 */
function getMockDisclosures(
  type: 'creditApplication' | 'prequalification' | 'txtMessageNotifications' | 'termsAndConditions' | null,
  language: string
) {
  const allDisclosures = [
    {
      id: 'disclosure_credit_1',
      name: 'Credit Application Authorization',
      type: 'creditApplication',
      version: '2024.01',
      versionNumber: 1,
      summary: 'Authorization to obtain credit information',
      text: `By checking this box, you authorize ${language === 'Spanish' ? 'Palmetto' : 'LightReach'} and its financing partners to obtain your credit report and verify your credit history for the purpose of evaluating your application for financing. This may include a hard credit inquiry which could affect your credit score.`,
      requireConsent: true,
      acceptanceLabel: 'I authorize the credit check',
      language,
    },
    {
      id: 'disclosure_prequal_1',
      name: 'Prequalification Disclosure',
      type: 'prequalification',
      version: '2024.01',
      versionNumber: 1,
      summary: 'Soft credit pull for prequalification',
      text: 'By continuing, you authorize a soft credit inquiry to prequalify you for financing options. This will NOT affect your credit score.',
      requireConsent: true,
      acceptanceLabel: 'I understand and agree',
      language,
    },
    {
      id: 'disclosure_sms_1',
      name: 'Text Message Notifications',
      type: 'txtMessageNotifications',
      version: '2024.01',
      versionNumber: 1,
      summary: 'Consent to receive SMS notifications',
      text: 'By checking this box, you consent to receive text message notifications regarding your financing application and account status. Message and data rates may apply. You can opt out at any time by replying STOP.',
      requireConsent: false,
      acceptanceLabel: 'I consent to receive text messages',
      language,
    },
    {
      id: 'disclosure_terms_1',
      name: 'Terms and Conditions',
      type: 'termsAndConditions',
      version: '2024.01',
      versionNumber: 1,
      summary: 'Comfort Plan lease terms and conditions',
      text: 'Please review the full terms and conditions of the Comfort Plan lease agreement. By signing the contract, you agree to all terms outlined in the agreement including monthly payment obligations, maintenance requirements, and early termination provisions.',
      requireConsent: true,
      acceptanceLabel: 'I have read and agree to the Terms and Conditions',
      language,
    },
  ]

  if (type) {
    return allDisclosures.filter((d) => d.type === type)
  }

  return allDisclosures
}
