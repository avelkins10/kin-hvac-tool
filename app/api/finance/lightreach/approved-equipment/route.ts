import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { lightReachClient } from '@/lib/integrations/lightreach'
import {
  FinanceError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors'

// In-memory cache for approved vendors (refresh every hour)
const vendorCache: Map<string, { data: any[]; timestamp: number }> = new Map()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * GET /api/finance/lightreach/approved-equipment
 * Get approved vendors/equipment list for HVAC.
 *
 * Query params:
 * - equipmentType: string (optional, e.g., 'heatPump', 'airHandler', 'furnace')
 *                  If not provided, returns all equipment types
 * - refresh: boolean (optional, force refresh cache)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const equipmentType = searchParams.get('equipmentType')
    const forceRefresh = searchParams.get('refresh') === 'true'

    console.log('[ApprovedEquipment] Getting approved vendors:', {
      equipmentType: equipmentType || 'all',
      forceRefresh,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
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
      // Return mock data in test mode
      const mockVendors = getMockApprovedVendors(equipmentType)
      return NextResponse.json({
        vendors: mockVendors,
        equipmentType: equipmentType || 'all',
        cached: false,
      })
    }

    // Equipment types to fetch
    const equipmentTypes = equipmentType
      ? [equipmentType]
      : ['heatPump', 'airHandler', 'heatStrip', 'thermostat', 'furnace']

    const allVendors: any[] = []

    for (const type of equipmentTypes) {
      const cacheKey = `vendors_${type}`
      const cached = vendorCache.get(cacheKey)

      // Check cache (unless force refresh)
      if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
        allVendors.push(...cached.data.map((v) => ({ ...v, equipmentType: type })))
        continue
      }

      // Fetch from API
      try {
        const vendors = await lightReachClient.getApprovedVendors(type)
        vendorCache.set(cacheKey, { data: vendors, timestamp: Date.now() })
        allVendors.push(...vendors.map((v) => ({ ...v, equipmentType: type })))
      } catch (err) {
        console.warn(`[ApprovedEquipment] Failed to fetch ${type} vendors:`, err)
        // Use cached data if available, even if stale
        if (cached) {
          allVendors.push(...cached.data.map((v) => ({ ...v, equipmentType: type })))
        }
      }
    }

    return NextResponse.json({
      vendors: allVendors,
      equipmentType: equipmentType || 'all',
      cached: false,
    })
  } catch (error) {
    logFinanceError(error, 'approved-equipment')

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
 * POST /api/finance/lightreach/approved-equipment
 * Validate equipment against approved vendor list.
 *
 * Body:
 * - manufacturer: string
 * - model: string
 * - equipmentType: string
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { manufacturer, model, equipmentType } = body

    if (!manufacturer || !model || !equipmentType) {
      return NextResponse.json(
        { error: 'manufacturer, model, and equipmentType are required' },
        { status: 400 }
      )
    }

    console.log('[ApprovedEquipment] Validating equipment:', {
      manufacturer,
      model,
      equipmentType,
      userId: session.user.id,
    })

    // Check if test mode
    const enableTestMode = process.env.ENABLE_FINANCE_TEST_MODE === 'true'
    const hasCredentials =
      !!process.env.PALMETTO_FINANCE_ACCOUNT_EMAIL &&
      !!process.env.PALMETTO_FINANCE_ACCOUNT_PASSWORD

    if (!hasCredentials && enableTestMode) {
      // In test mode, approve common manufacturers
      const commonManufacturers = [
        'carrier',
        'trane',
        'lennox',
        'goodman',
        'rheem',
        'daikin',
        'bryant',
        'american standard',
      ]
      const approved = commonManufacturers.includes(manufacturer.toLowerCase())
      return NextResponse.json({
        approved,
        manufacturer,
        model,
        equipmentType,
        message: approved
          ? 'Equipment is on the approved vendor list (test mode)'
          : 'Equipment NOT found on approved vendor list (test mode)',
      })
    }

    if (!hasCredentials) {
      return NextResponse.json(
        {
          error: 'LightReach credentials not configured',
          code: 'CREDENTIALS_REQUIRED',
        },
        { status: 503 }
      )
    }

    // Validate against real API
    const result = await lightReachClient.validateEquipment(manufacturer, model, equipmentType)

    return NextResponse.json({
      approved: result.approved,
      manufacturer,
      model,
      equipmentType,
      vendor: result.vendor,
      message: result.approved
        ? 'Equipment is on the approved vendor list'
        : 'Equipment NOT found on approved vendor list - submission may still proceed',
    })
  } catch (error) {
    logFinanceError(error, 'validate-equipment')

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
 * Generate mock approved vendors for test mode
 */
function getMockApprovedVendors(equipmentType: string | null) {
  const manufacturers = [
    'Carrier',
    'Trane',
    'Lennox',
    'Goodman',
    'Rheem',
    'Daikin',
    'Bryant',
    'American Standard',
    'Mitsubishi Electric',
    'LG',
  ]

  const types = equipmentType
    ? [equipmentType]
    : ['heatPump', 'airHandler', 'furnace', 'thermostat', 'heatStrip']

  const vendors: any[] = []

  for (const type of types) {
    for (const mfr of manufacturers) {
      vendors.push({
        manufacturer: mfr,
        model: `${mfr.toUpperCase().substring(0, 3)}-${type.toUpperCase()}-001`,
        type,
        equipmentType: type,
        productId: `test_${type}_${mfr.toLowerCase().replace(/\s+/g, '_')}`,
      })
    }
  }

  return vendors
}
