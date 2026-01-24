"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Maintenance Plan
export interface MaintenancePlan {
  id: string
  name: string
  tier: "basic" | "standard" | "premium"
  description: string
  baseCost: number
  marginType: "fixed" | "percentage"
  marginAmount: number
  visitsPerYear: number
  features: string[]
  enabled: boolean
}

// Multi-year bundle discount
export interface BundleDiscount {
  id: string
  years: number
  discountPercent: number
  label: string
  badge?: string
}

// Maintenance Context Data
export interface MaintenanceData {
  plans: MaintenancePlan[]
  bundleDiscounts: BundleDiscount[]
}

// Default maintenance plans (matching screenshots)
const defaultPlans: MaintenancePlan[] = [
  {
    id: "1",
    name: "Basic Maintenance",
    tier: "basic",
    description: "Essential annual tune-up to keep your system running",
    baseCost: 214,
    marginType: "percentage",
    marginAmount: 40,
    visitsPerYear: 1,
    features: [
      "Annual system inspection",
      "Thermostat calibration",
      "15% discount on repairs",
      "Filter replacement",
      "Basic cleaning",
      "Priority scheduling",
    ],
    enabled: true,
  },
  {
    id: "2",
    name: "Standard Maintenance",
    tier: "standard",
    description: "Comprehensive bi-annual service for optimal performance",
    baseCost: 428,
    marginType: "percentage",
    marginAmount: 40,
    visitsPerYear: 2,
    features: [
      "Spring & fall tune-ups (2 visits)",
      "Complete system cleaning",
      "Electrical connection testing",
      "20% discount on repairs",
      "No trip charges",
      "Premium filter replacements",
      "Refrigerant level check",
      "Condensate drain cleaning",
      "Priority emergency service",
    ],
    enabled: true,
  },
  {
    id: "3",
    name: "Premium Care Plan",
    tier: "premium",
    description: "Ultimate protection with quarterly visits and best coverage",
    baseCost: 699,
    marginType: "fixed",
    marginAmount: 200,
    visitsPerYear: 4,
    features: [
      "Quarterly system check-ups (4 visits)",
      "Deep coil cleaning",
      "Refrigerant optimization",
      "Smart thermostat optimization",
      "Priority 24/7 emergency service",
      "Parts coverage up to $500/year",
      "Premium HEPA filter replacements",
      "Full electrical inspection",
      "Duct inspection & cleaning",
      "25% discount on all repairs",
      "No trip or diagnostic charges",
      "Transferable to new homeowner",
    ],
    enabled: true,
  },
]

// Default bundle discounts
const defaultBundleDiscounts: BundleDiscount[] = [
  { id: "1", years: 3, discountPercent: 5, label: "3-Year Bundle" },
  { id: "2", years: 5, discountPercent: 10, label: "5-Year Bundle", badge: "Popular" },
  { id: "3", years: 7, discountPercent: 15, label: "7-Year Bundle", badge: "Best Value" },
]

interface MaintenanceContextType {
  plans: MaintenancePlan[]
  bundleDiscounts: BundleDiscount[]
  selectedPlan: MaintenancePlan | null
  selectedBundleYears: number | null
  setSelectedPlan: (plan: MaintenancePlan | null) => void
  setSelectedBundleYears: (years: number | null) => void
  updatePlan: (plan: MaintenancePlan) => void
  addPlan: (plan: Omit<MaintenancePlan, "id">) => void
  deletePlan: (id: string) => void
  updateBundleDiscount: (discount: BundleDiscount) => void
  getPlanSalesPrice: (plan: MaintenancePlan) => number
  getPlanGrossProfit: (plan: MaintenancePlan) => number
  getPlanMarkupPercent: (plan: MaintenancePlan) => number
  getPlanMonthlyPrice: (plan: MaintenancePlan) => number
  getCostPerVisit: (plan: MaintenancePlan) => number
  getBundleTotal: (plan: MaintenancePlan, years: number) => { total: number; discount: number; finalPrice: number }
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined)

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<MaintenancePlan[]>(defaultPlans)
  const [bundleDiscounts, setBundleDiscounts] = useState<BundleDiscount[]>(defaultBundleDiscounts)
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null)
  const [selectedBundleYears, setSelectedBundleYears] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Load from API
  useEffect(() => {
    const loadMaintenanceData = async () => {
      try {
        // Load plans from API
        const plansResponse = await fetch('/api/company/maintenance-plans')
        if (plansResponse.ok) {
          const apiPlans = await plansResponse.json()
          // Transform API data to match MaintenancePlan interface
          // Note: API may not have all fields, so we merge with defaults
          const transformed = apiPlans.map((item: any) => {
            const defaultPlan = defaultPlans.find((p) => p.name === item.name) || defaultPlans[0]
            return {
              id: item.id,
              name: item.name,
              tier: (item.tier as "basic" | "standard" | "premium") || defaultPlan.tier,
              description: defaultPlan.description,
              baseCost: item.baseCost,
              marginType: (item.marginType as "fixed" | "percentage") || defaultPlan.marginType,
              marginAmount: item.marginAmount || defaultPlan.marginAmount,
              visitsPerYear: defaultPlan.visitsPerYear,
              features: defaultPlan.features,
              enabled: true,
            }
          })
          if (transformed.length > 0) {
            setPlans(transformed)
          }
        }

        // Load bundle discounts from company settings
        const settingsResponse = await fetch('/api/company/settings')
        if (settingsResponse.ok) {
          const company = await settingsResponse.json()
          if (company.settings?.bundleDiscounts) {
            setBundleDiscounts(company.settings.bundleDiscounts)
          }
        }
      } catch (error) {
        console.error('Failed to load maintenance data from API', error)
      } finally {
        setLoading(false)
      }
    }
    loadMaintenanceData()
  }, [])

  // Save bundle discounts to company settings
  useEffect(() => {
    const saveBundleDiscounts = async () => {
      try {
        const settingsResponse = await fetch('/api/company/settings')
        if (settingsResponse.ok) {
          const company = await settingsResponse.json()
          await fetch('/api/company/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              settings: {
                ...company.settings,
                bundleDiscounts,
              },
            }),
          })
        }
      } catch (error) {
        console.error('Failed to save bundle discounts', error)
      }
    }
    if (!loading) {
      saveBundleDiscounts()
    }
  }, [bundleDiscounts, loading])

  // Calculate sales price
  const getPlanSalesPrice = (plan: MaintenancePlan): number => {
    if (plan.marginType === "fixed") {
      return plan.baseCost + plan.marginAmount
    }
    return Math.round(plan.baseCost * (1 + plan.marginAmount / 100))
  }

  // Calculate gross profit
  const getPlanGrossProfit = (plan: MaintenancePlan): number => {
    if (plan.marginType === "fixed") {
      return plan.marginAmount
    }
    return Math.round(plan.baseCost * (plan.marginAmount / 100))
  }

  // Calculate markup percent
  const getPlanMarkupPercent = (plan: MaintenancePlan): number => {
    const profit = getPlanGrossProfit(plan)
    return Math.round((profit / plan.baseCost) * 1000) / 10
  }

  // Calculate monthly price
  const getPlanMonthlyPrice = (plan: MaintenancePlan): number => {
    return Math.round(getPlanSalesPrice(plan) / 12)
  }

  // Calculate cost per visit
  const getCostPerVisit = (plan: MaintenancePlan): number => {
    return Math.round(getPlanSalesPrice(plan) / plan.visitsPerYear)
  }

  // Calculate bundle total with discount
  const getBundleTotal = (plan: MaintenancePlan, years: number) => {
    const annualPrice = getPlanSalesPrice(plan)
    const total = annualPrice * years
    const bundleDiscount = bundleDiscounts.find((b) => b.years === years)
    const discountPercent = bundleDiscount?.discountPercent || 0
    const discount = Math.round(total * (discountPercent / 100))
    const finalPrice = total - discount
    return { total, discount, finalPrice }
  }

  // CRUD operations
  const updatePlan = async (plan: MaintenancePlan) => {
    try {
      const response = await fetch(`/api/company/maintenance-plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          tier: plan.tier,
          baseCost: plan.baseCost,
          marginType: plan.marginType,
          marginAmount: plan.marginAmount,
        }),
      })
      if (response.ok) {
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)))
      }
    } catch (error) {
      console.error('Failed to update maintenance plan', error)
    }
  }

  const addPlan = async (plan: Omit<MaintenancePlan, "id">) => {
    try {
      const response = await fetch('/api/company/maintenance-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          tier: plan.tier,
          baseCost: plan.baseCost,
          marginType: plan.marginType,
          marginAmount: plan.marginAmount,
        }),
      })
      if (response.ok) {
        const newPlan = await response.json()
        setPlans((prev) => [...prev, { ...plan, id: newPlan.id }])
      }
    } catch (error) {
      console.error('Failed to add maintenance plan', error)
    }
  }

  const deletePlan = async (id: string) => {
    try {
      const response = await fetch(`/api/company/maintenance-plans/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete maintenance plan', error)
    }
  }

  const updateBundleDiscount = (discount: BundleDiscount) => {
    setBundleDiscounts((prev) => prev.map((d) => (d.id === discount.id ? discount : d)))
  }

  return (
    <MaintenanceContext.Provider
      value={{
        plans,
        bundleDiscounts,
        selectedPlan,
        selectedBundleYears,
        setSelectedPlan,
        setSelectedBundleYears,
        updatePlan,
        addPlan,
        deletePlan,
        updateBundleDiscount,
        getPlanSalesPrice,
        getPlanGrossProfit,
        getPlanMarkupPercent,
        getPlanMonthlyPrice,
        getCostPerVisit,
        getBundleTotal,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  )
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext)
  if (!context) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider")
  }
  return context
}
