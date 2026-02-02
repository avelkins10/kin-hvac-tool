// Finance helper utilities for Comfort Plan detection and validation

interface Proposal {
  id: string
  paymentMethod?: {
    method?: string
    option?: any
  } | null
  financingOption?: {
    provider?: string
    id?: string
    name?: string
    type?: string
  } | null
  [key: string]: any
}

interface FinancingOption {
  id: string
  provider?: string
  type?: string
  name?: string
  [key: string]: any
}

/**
 * Check if a proposal has Comfort Plan (LightReach HVAC lease) selected
 */
export function isComfortPlanSelected(proposal: Proposal): boolean {
  if (!proposal) return false

  const paymentMethod = proposal.paymentMethod
  const financingOption = proposal.financingOption

  // Check if leasing is selected
  const isLeasing = paymentMethod?.method === 'leasing'

  // Check if LightReach/Lightreach provider is selected
  const provider = financingOption?.provider || paymentMethod?.option?.provider
  const isLightReach = provider?.toLowerCase() === 'lightreach' || provider?.toLowerCase() === 'lightreach'

  return isLeasing && isLightReach
}

/**
 * Get the selected Comfort Plan financing option from a proposal
 */
export function getComfortPlanOption(proposal: Proposal): FinancingOption | null {
  if (!isComfortPlanSelected(proposal)) {
    return null
  }

  return proposal.financingOption || proposal.paymentMethod?.option || null
}

/**
 * Determine if finance application UI should be shown for a proposal
 */
export function shouldShowFinanceApplication(proposal: Proposal): boolean {
  if (!proposal || !proposal.id) {
    return false
  }

  return isComfortPlanSelected(proposal)
}

/**
 * Extract customer data from proposal for pre-filling finance application form
 */
export function extractCustomerDataFromProposal(proposal: Proposal): {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
} {
  const customerData = proposal.customerData as any

  if (!customerData) {
    return {}
  }

  // Handle different possible formats
  const name = customerData.name || ''
  const nameParts = name.split(' ').filter(Boolean)
  const firstName = nameParts[0] || customerData.firstName || ''
  const lastName = nameParts.slice(1).join(' ') || customerData.lastName || ''

  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: customerData.email?.trim() || '',
    phone: customerData.phone?.trim() || '',
    address: customerData.address?.trim() || '',
    city: customerData.city?.trim() || '',
    state: customerData.state?.trim() || '',
    zip: customerData.zip?.trim() || '',
  }
}

/**
 * Get system price from proposal totals
 */
export function getSystemPriceFromProposal(proposal: Proposal): number {
  const totals = proposal.totals as any
  if (totals?.total) {
    return totals.total
  }
  if (totals?.equipment) {
    return totals.equipment
  }
  return 0
}

/**
 * Build Palmetto HVAC systemDesign from proposal for more accurate pricing.
 * Used when fetching payment schedule / pricing so Palmetto can return pricing based on equipment.
 * See LightReach API: POST /api/v2/accounts/{accountId}/pricing/hvac
 */
export function buildSystemDesignFromProposal(proposal: {
  homeData?: any
  selectedEquipment?: any
}): Record<string, unknown> | undefined {
  const homeData = proposal?.homeData as { squareFootage?: number } | undefined
  const equipment = proposal?.selectedEquipment as {
    tier?: string
    seer?: number
    tonnage?: number
    name?: string
  } | undefined

  const conditionedArea = homeData?.squareFootage
  if (!conditionedArea || conditionedArea <= 0) return undefined

  const tonnageValue =
    equipment?.tonnage ?? (conditionedArea <= 1500 ? 2.5 : conditionedArea <= 2500 ? 3.5 : 4)
  const seerValue = equipment?.seer ?? 16
  const systemCategory =
    equipment?.tier === 'best' ? 'Heat Pump Split System' : 'Conventional Ducted Split System'

  return {
    isPreliminary: true,
    systems: [
      {
        systemCategory,
        conditionedArea: Number(conditionedArea),
        name: equipment?.name,
        equipment: {
          items: [
            {
              type: 'airConditioner',
              quantity: 1,
              size: { unit: 'ton', value: String(tonnageValue) },
              efficiencies: [{ unit: 'SEER', value: String(seerValue) }],
            },
          ],
        },
      },
    ],
  } as Record<string, unknown>
}
