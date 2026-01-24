"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export const DEFAULT_TIER_PRICES = {
  good: 12499,
  better: 14499,
  best: 18499,
}

// Payment factors per $1 of system price for LightReach Comfort Plan
// Calculated from official LightReach calculator: $14,998 system price
export const LIGHTREACH_PAYMENT_FACTORS = {
  "10yr_0%": 0.01546,      // $231.92/mo on $14,998
  "10yr_0.99%": 0.01487,   // $222.99/mo on $14,998
  "10yr_1.99%": 0.01416,   // $212.33/mo on $14,998
  "12yr_0%": 0.01397,      // $209.57/mo on $14,998
  "12yr_0.99%": 0.01321,   // $198.08/mo on $14,998
  "12yr_1.99%": 0.01247,   // $187.04/mo on $14,998
}

// Lightreach lease configuration
export interface LightreachLeaseConfig {
  termYears: 10 | 12
  escalatorPercent: 0 | 0.99 | 1.99
}

// Calculate Lightreach monthly payment
export function calculateLightreachPayment(
  systemPrice: number,
  termYears: 10 | 12,
  escalatorPercent: 0 | 0.99 | 1.99,
): { monthlyPayment: number; totalCost: number; escalatorNote: string } {
  const key = `${termYears}yr_${escalatorPercent}%` as keyof typeof LIGHTREACH_PAYMENT_FACTORS
  const factor = LIGHTREACH_PAYMENT_FACTORS[key]
  const monthlyPayment = Math.round(systemPrice * factor * 100) / 100

  // Calculate total cost with escalator
  let totalCost = 0
  let currentMonthly = monthlyPayment
  const totalMonths = termYears * 12

  for (let year = 0; year < termYears; year++) {
    if (year > 0 && escalatorPercent > 0) {
      currentMonthly = currentMonthly * (1 + escalatorPercent / 100)
    }
    totalCost += currentMonthly * 12
  }

  const escalatorNote =
    escalatorPercent > 0 ? `Year 1, increases ${escalatorPercent}% annually` : "Fixed monthly payment"

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    escalatorNote,
  }
}

// What's included in Lightreach lease
export const LIGHTREACH_INCLUSIONS = [
  "Filters (included for term)",
  "IAQ Media (included for term)",
  "Repair Labor (included for term)",
  "Preventive Maintenance (included for term)",
  "No upfront cost",
  "$0 down payment",
  "Inflation-proof protection",
]

// HVAC System (for customer-facing tiers)
export interface HVACSystem {
  id: string
  name: string
  tier: "good" | "better" | "best"
  description: string
  baseCost: number
  marginType: "fixed" | "percentage"
  marginAmount: number
  features: string[]
  enabled: boolean
}

// Add-on item
export interface AddOn {
  id: string
  name: string
  description: string
  baseCost: number
  marginType: "fixed" | "percentage"
  marginAmount: number
  enabled: boolean
}

// Material item
export interface Material {
  id: string
  name: string
  category: string
  description: string
  costPerUnit: number
  unit: string
  defaultQty: number
}

// Labor rate
export interface LaborRate {
  id: string
  name: string
  description: string
  rate: number
  isDefault: boolean
}

// Permit fee
export interface PermitFee {
  id: string
  name: string
  tonnageRange: string
  fee: number
}

// Price Book Unit (for detailed job costing)
export interface PriceBookUnit {
  id: string
  name: string
  tier: "good" | "better" | "best"
  tonnage: number
  equipmentCost: number
  installLaborHours: number
  seerRating: number
  brand: string
  modelNumber: string
  leadTimeDays: number
  systemType: string
}

// Financing option
export interface FinancingOption {
  id: string
  name: string
  type: "cash" | "finance" | "lease"
  termMonths: number
  apr: number
  dealerFee: number
  description: string
  available: boolean
  provider?: string
}

// Pricing settings
export interface PricingSettings {
  overheadMultiplier: number
  profitMargin: number
  taxRate: number
  marginVisible: boolean
  cashMarkup: number
}

// Full price book
export interface PriceBook {
  hvacSystems: HVACSystem[]
  addOns: AddOn[]
  materials: Material[]
  laborRates: LaborRate[]
  permitFees: PermitFee[]
  units: PriceBookUnit[]
  financingOptions: FinancingOption[]
  settings: PricingSettings
}

// Default HVAC Systems (matching screenshots)
const defaultHVACSystems: HVACSystem[] = [
  {
    id: "1",
    name: "Essential Comfort",
    tier: "good",
    description: "Goodman GSX16 Series",
    baseCost: 9999,
    marginType: "fixed",
    marginAmount: 2500,
    features: [
      "16 SEER Energy Efficiency",
      "Standard 10-Year Warranty",
      "Single-Stage Cooling",
      "Quiet Operation",
      "Reliable Performance",
    ],
    enabled: true,
  },
  {
    id: "2",
    name: "Premium Comfort",
    tier: "better",
    description: "Daikin DX18TC Series",
    baseCost: 11499,
    marginType: "fixed",
    marginAmount: 3000,
    features: [
      "18 SEER High Efficiency",
      "Extended 12-Year Warranty",
      "Two-Stage Cooling",
      "Ultra-Quiet Operation",
      "Enhanced Humidity Control",
      "Smart Thermostat Compatible",
      "Energy Star Certified",
    ],
    enabled: true,
  },
  {
    id: "3",
    name: "Ultimate Comfort",
    tier: "best",
    description: "Daikin DX20VC Variable Speed",
    baseCost: 14999,
    marginType: "fixed",
    marginAmount: 3500,
    features: [
      "20 SEER Maximum Efficiency",
      "Premium 12-Year Warranty + 2 Year Labor",
      "Variable Speed Inverter Technology",
      "Whisper-Quiet Operation",
      "Superior Humidity Control",
      "Wi-Fi Enabled Smart Controls",
      "Energy Star Most Efficient",
      "Lifetime Compressor Warranty",
    ],
    enabled: true,
  },
]

// Default Add-ons (matching screenshots)
const defaultAddOns: AddOn[] = [
  {
    id: "1",
    name: "UV Light Air Purifier",
    description: "Kills 99.9% of airborne bacteria",
    baseCost: 500,
    marginType: "fixed",
    marginAmount: 350,
    enabled: true,
  },
  {
    id: "2",
    name: "HEPA Filtration System",
    description: "Hospital-grade air cleaning",
    baseCost: 400,
    marginType: "fixed",
    marginAmount: 250,
    enabled: true,
  },
  {
    id: "3",
    name: "Extended Warranty (10yr)",
    description: "Complete coverage & priority service",
    baseCost: 800,
    marginType: "fixed",
    marginAmount: 400,
    enabled: true,
  },
  {
    id: "4",
    name: "Premium Smart Thermostat",
    description: "Advanced scheduling & remote control",
    baseCost: 250,
    marginType: "fixed",
    marginAmount: 200,
    enabled: true,
  },
  {
    id: "5",
    name: "Duct Sealing Package",
    description: "Improve efficiency by up to 20%",
    baseCost: 600,
    marginType: "fixed",
    marginAmount: 300,
    enabled: true,
  },
  {
    id: "6",
    name: "Surge Protector",
    description: "Protect your investment from power surges",
    baseCost: 150,
    marginType: "fixed",
    marginAmount: 100,
    enabled: true,
  },
]

// Default Materials
const defaultMaterials: Material[] = [
  {
    id: "1",
    name: "R-410A Refrigerant",
    category: "Refrigerant",
    description: "R-410A refrigerant per pound",
    costPerUnit: 12,
    unit: "lb",
    defaultQty: 8,
  },
  {
    id: "2",
    name: "25ft Line Set",
    category: "Refrigerant",
    description: "25ft refrigerant line set",
    costPerUnit: 120,
    unit: "each",
    defaultQty: 1,
  },
  {
    id: "3",
    name: "Disconnect Box",
    category: "Electrical",
    description: "60A disconnect box",
    costPerUnit: 45,
    unit: "each",
    defaultQty: 1,
  },
  {
    id: "4",
    name: "Thermostat Wire",
    category: "Electrical",
    description: "18/8 thermostat wire per foot",
    costPerUnit: 1.5,
    unit: "ft",
    defaultQty: 50,
  },
  {
    id: "5",
    name: "Condenser Pad",
    category: "Mounting",
    description: "Concrete condenser pad",
    costPerUnit: 75,
    unit: "each",
    defaultQty: 1,
  },
]

// Default Labor Rates
const defaultLaborRates: LaborRate[] = [
  { id: "1", name: "Standard Crew Rate", description: "2-person crew standard rate", rate: 150, isDefault: true },
  {
    id: "2",
    name: "Premium Crew Rate",
    description: "2-person crew premium rate (complex installs)",
    rate: 200,
    isDefault: false,
  },
  { id: "3", name: "Apprentice Rate", description: "Single apprentice rate", rate: 75, isDefault: false },
]

// Default Permit Fees
const defaultPermitFees: PermitFee[] = [
  { id: "1", name: "Small System", tonnageRange: "2-2.5 Ton", fee: 200 },
  { id: "2", name: "Medium System", tonnageRange: "3-3.5 Ton", fee: 225 },
  { id: "3", name: "Large System", tonnageRange: "4-5 Ton", fee: 275 },
]

// Default Units (for Price Book detailed costing)
const defaultUnits: PriceBookUnit[] = [
  {
    id: "1",
    name: "Goodman GSX160241",
    tier: "good",
    tonnage: 2,
    equipmentCost: 2400,
    installLaborHours: 8,
    seerRating: 16,
    brand: "Goodman",
    modelNumber: "GSX160241",
    leadTimeDays: 3,
    systemType: "Air Conditioner",
  },
  {
    id: "2",
    name: "Goodman GSX170241",
    tier: "better",
    tonnage: 2,
    equipmentCost: 3200,
    installLaborHours: 8,
    seerRating: 17,
    brand: "Goodman",
    modelNumber: "GSX170241",
    leadTimeDays: 5,
    systemType: "Air Conditioner",
  },
  {
    id: "3",
    name: "Daikin DX18TC0241A",
    tier: "better",
    tonnage: 2,
    equipmentCost: 3800,
    installLaborHours: 9,
    seerRating: 18,
    brand: "Daikin",
    modelNumber: "DX18TC0241A",
    leadTimeDays: 5,
    systemType: "Air Conditioner",
  },
  {
    id: "4",
    name: "Daikin DX20VC0241A",
    tier: "best",
    tonnage: 2,
    equipmentCost: 5200,
    installLaborHours: 10,
    seerRating: 20,
    brand: "Daikin",
    modelNumber: "DX20VC0241A",
    leadTimeDays: 7,
    systemType: "Air Conditioner",
  },
  {
    id: "5",
    name: "Goodman GSX160361",
    tier: "good",
    tonnage: 3,
    equipmentCost: 2800,
    installLaborHours: 9,
    seerRating: 16,
    brand: "Goodman",
    modelNumber: "GSX160361",
    leadTimeDays: 3,
    systemType: "Air Conditioner",
  },
  {
    id: "6",
    name: "Goodman GSX170361",
    tier: "better",
    tonnage: 3,
    equipmentCost: 3600,
    installLaborHours: 9,
    seerRating: 17,
    brand: "Goodman",
    modelNumber: "GSX170361",
    leadTimeDays: 5,
    systemType: "Air Conditioner",
  },
  {
    id: "7",
    name: "Daikin DX18TC0361A",
    tier: "better",
    tonnage: 3,
    equipmentCost: 4200,
    installLaborHours: 10,
    seerRating: 18,
    brand: "Daikin",
    modelNumber: "DX18TC0361A",
    leadTimeDays: 5,
    systemType: "Air Conditioner",
  },
  {
    id: "8",
    name: "Daikin DX20VC0361A",
    tier: "best",
    tonnage: 3,
    equipmentCost: 5800,
    installLaborHours: 11,
    seerRating: 20,
    brand: "Daikin",
    modelNumber: "DX20VC0361A",
    leadTimeDays: 7,
    systemType: "Air Conditioner",
  },
  {
    id: "9",
    name: "Goodman GSX160481",
    tier: "good",
    tonnage: 4,
    equipmentCost: 3200,
    installLaborHours: 10,
    seerRating: 16,
    brand: "Goodman",
    modelNumber: "GSX160481",
    leadTimeDays: 3,
    systemType: "Air Conditioner",
  },
  {
    id: "10",
    name: "Goodman GSX170481",
    tier: "better",
    tonnage: 4,
    equipmentCost: 4000,
    installLaborHours: 10,
    seerRating: 17,
    brand: "Goodman",
    modelNumber: "GSX170481",
    leadTimeDays: 5,
    systemType: "Air Conditioner",
  },
  {
    id: "11",
    name: "Daikin DX18TC0481A",
    tier: "better",
    tonnage: 4,
    equipmentCost: 4800,
    installLaborHours: 11,
    seerRating: 18,
    brand: "Daikin",
    modelNumber: "DX18TC0481A",
    leadTimeDays: 5,
    systemType: "Air Conditioner",
  },
  {
    id: "12",
    name: "Daikin DX20VC0481A",
    tier: "best",
    tonnage: 4,
    equipmentCost: 6400,
    installLaborHours: 12,
    seerRating: 20,
    brand: "Daikin",
    modelNumber: "DX20VC0481A",
    leadTimeDays: 7,
    systemType: "Air Conditioner",
  },
  {
    id: "13",
    name: "Goodman GSX160601",
    tier: "good",
    tonnage: 5,
    equipmentCost: 3600,
    installLaborHours: 11,
    seerRating: 16,
    brand: "Goodman",
    modelNumber: "GSX160601",
    leadTimeDays: 3,
    systemType: "Air Conditioner",
  },
  {
    id: "14",
    name: "Goodman GSX170601",
    tier: "better",
    tonnage: 5,
    equipmentCost: 4400,
    installLaborHours: 11,
    seerRating: 17,
    brand: "Goodman",
    modelNumber: "GSX170601",
    leadTimeDays: 5,
    systemType: "Air Conditioner",
  },
  {
    id: "15",
    name: "Daikin DX18TC0601A",
    tier: "better",
    tonnage: 5,
    equipmentCost: 5400,
    installLaborHours: 12,
    seerRating: 18,
    brand: "Daikin",
    modelNumber: "DX18TC0601A",
    leadTimeDays: 5,
    systemType: "Air Conditioner",
  },
  {
    id: "16",
    name: "Daikin DX20VC0601A",
    tier: "best",
    tonnage: 5,
    equipmentCost: 7200,
    installLaborHours: 13,
    seerRating: 20,
    brand: "Daikin",
    modelNumber: "DX20VC0601A",
    leadTimeDays: 7,
    systemType: "Air Conditioner",
  },
]

// Default Financing Options (including Lightreach with correct payment factors)
const defaultFinancingOptions: FinancingOption[] = [
  {
    id: "1",
    name: "Cash Payment",
    type: "cash",
    termMonths: 0,
    apr: 0,
    dealerFee: 0,
    description: "Pay in full - receive 5% discount",
    available: true,
  },
  {
    id: "2",
    name: "Same-As-Cash 12 Months",
    type: "finance",
    termMonths: 12,
    apr: 0,
    dealerFee: 5,
    description: "No interest if paid in full within 12 months",
    available: true,
    provider: "GreenSky",
  },
  {
    id: "3",
    name: "60 Month Financing",
    type: "finance",
    termMonths: 60,
    apr: 9.99,
    dealerFee: 8,
    description: "Low monthly payments",
    available: true,
    provider: "GreenSky",
  },
  {
    id: "4",
    name: "84 Month Financing",
    type: "finance",
    termMonths: 84,
    apr: 11.99,
    dealerFee: 10,
    description: "Extended term option",
    available: true,
    provider: "GreenSky",
  },
  {
    id: "5",
    name: "120 Month Financing",
    type: "finance",
    termMonths: 120,
    apr: 12.99,
    dealerFee: 12,
    description: "Lowest monthly payment",
    available: true,
    provider: "GreenSky",
  },
  {
    id: "6",
    name: "Palmetto Comfort Plan - 10 Year (0% Escalator)",
    type: "lease",
    termMonths: 120,
    apr: 0,
    dealerFee: 0,
    description: "Fixed payment - Maintenance, filters, repairs included",
    available: true,
    provider: "Lightreach",
  },
  {
    id: "7",
    name: "Palmetto Comfort Plan - 10 Year (0.99% Escalator)",
    type: "lease",
    termMonths: 120,
    apr: 0,
    dealerFee: 0,
    description: "Lower initial payment, increases 0.99% annually",
    available: true,
    provider: "Lightreach",
  },
  {
    id: "8",
    name: "Palmetto Comfort Plan - 10 Year (1.99% Escalator)",
    type: "lease",
    termMonths: 120,
    apr: 0,
    dealerFee: 0,
    description: "Lowest initial payment, increases 1.99% annually",
    available: true,
    provider: "Lightreach",
  },
  {
    id: "9",
    name: "Palmetto Comfort Plan - 12 Year (0% Escalator)",
    type: "lease",
    termMonths: 144,
    apr: 0,
    dealerFee: 0,
    description: "Fixed payment - Maintenance, filters, repairs included",
    available: true,
    provider: "Lightreach",
  },
  {
    id: "10",
    name: "Palmetto Comfort Plan - 12 Year (0.99% Escalator)",
    type: "lease",
    termMonths: 144,
    apr: 0,
    dealerFee: 0,
    description: "Lower initial payment, increases 0.99% annually",
    available: true,
    provider: "Lightreach",
  },
  {
    id: "11",
    name: "Palmetto Comfort Plan - 12 Year (1.99% Escalator)",
    type: "lease",
    termMonths: 144,
    apr: 0,
    dealerFee: 0,
    description: "Lowest initial payment, increases 1.99% annually",
    available: true,
    provider: "Lightreach",
  },
]

// Default Settings
const defaultSettings: PricingSettings = {
  overheadMultiplier: 1.15,
  profitMargin: 20,
  taxRate: 0,
  marginVisible: true,
  cashMarkup: 20,
}

// Default Price Book
const defaultPriceBook: PriceBook = {
  hvacSystems: defaultHVACSystems,
  addOns: defaultAddOns,
  materials: defaultMaterials,
  laborRates: defaultLaborRates,
  permitFees: defaultPermitFees,
  units: defaultUnits,
  financingOptions: defaultFinancingOptions,
  settings: defaultSettings,
}

interface PriceBookContextType {
  priceBook: PriceBook
  // HVAC Systems
  updateHVACSystem: (system: HVACSystem) => void
  addHVACSystem: (system: Omit<HVACSystem, "id">) => void
  deleteHVACSystem: (id: string) => void
  getSystemSalesPrice: (system: HVACSystem) => number
  getSystemGrossProfit: (system: HVACSystem) => number
  getSystemMarkupPercent: (system: HVACSystem) => number
  getTierPrice: (tier: "good" | "better" | "best", tonnage: number) => number
  // Add-ons
  updateAddOn: (addon: AddOn) => void
  addAddOn: (addon: Omit<AddOn, "id">) => void
  deleteAddOn: (id: string) => void
  getAddOnSalesPrice: (addon: AddOn) => number
  getAddOnGrossProfit: (addon: AddOn) => number
  getAddOnMarkupPercent: (addon: AddOn) => number
  // Materials
  updateMaterial: (material: Material) => void
  addMaterial: (material: Omit<Material, "id">) => void
  deleteMaterial: (id: string) => void
  // Labor Rates
  updateLaborRate: (rate: LaborRate) => void
  addLaborRate: (rate: Omit<LaborRate, "id">) => void
  deleteLaborRate: (id: string) => void
  setDefaultLaborRate: (id: string) => void
  getDefaultLaborRate: () => LaborRate | undefined
  // Permit Fees
  updatePermitFee: (fee: PermitFee) => void
  addPermitFee: (fee: Omit<PermitFee, "id">) => void
  deletePermitFee: (id: string) => void
  // Units
  updateUnit: (unit: PriceBookUnit) => void
  addUnit: (unit: Omit<PriceBookUnit, "id">) => void
  deleteUnit: (id: string) => void
  calculateUnitTotalCost: (unit: PriceBookUnit) => { equipment: number; labor: number; permit: number; total: number }
  // Financing
  financingOptions: FinancingOption[]
  updateFinancingOption: (option: FinancingOption) => void
  addFinancingOption: (option: Omit<FinancingOption, "id">) => void
  deleteFinancingOption: (id: string) => void
  getFinancingByType: (type: "cash" | "finance" | "lease") => FinancingOption[]
  calculateMonthlyPayment: (systemPrice: number, option: FinancingOption) => number
  // Settings
  updateSettings: (settings: Partial<PricingSettings>) => void
  getCustomerFacingPriceWithCashMarkup: (salesPrice: number, cashMarkupPercent: number) => number
  getCustomerPrice: (salesPrice: number) => number
  getSystemCustomerPrice: (tier: "good" | "better" | "best") => number
}

const PriceBookContext = createContext<PriceBookContextType | undefined>(undefined)

export function PriceBookProvider({ children }: { children: ReactNode }) {
  const [priceBook, setPriceBook] = useState<PriceBook>(defaultPriceBook)
  const [loading, setLoading] = useState(true)

  // Load from API
  useEffect(() => {
    const loadPriceBook = async () => {
      try {
        // Load all entities from their respective API routes
        const [systemsRes, addonsRes, materialsRes, laborRatesRes, permitsRes, unitsRes, financingRes, settingsRes] =
          await Promise.all([
            fetch('/api/company/hvac-systems'),
            fetch('/api/company/addons'),
            fetch('/api/company/materials'),
            fetch('/api/company/labor-rates'),
            fetch('/api/company/permits'),
            fetch('/api/company/pricebook'),
            fetch('/api/company/financing-options'),
            fetch('/api/company/settings'),
          ])

        const systems = systemsRes.ok ? await systemsRes.json() : []
        const addons = addonsRes.ok ? await addonsRes.json() : []
        const materials = materialsRes.ok ? await materialsRes.json() : []
        const laborRates = laborRatesRes.ok ? await laborRatesRes.json() : []
        const permits = permitsRes.ok ? await permitsRes.json() : []
        const units = unitsRes.ok ? await unitsRes.json() : []
        const financing = financingRes.ok ? await financingRes.json() : []
        const company = settingsRes.ok ? await settingsRes.json() : null

        // Transform API data to match context interfaces
        const transformedSystems: HVACSystem[] = systems.map((item: any) => ({
          id: item.id,
          name: item.name,
          tier: (item.tier as "good" | "better" | "best") || "good",
          description: item.name,
          baseCost: item.baseCost,
          marginType: (item.marginType as "fixed" | "percentage") || "fixed",
          marginAmount: item.marginAmount || 0,
          features: [],
          enabled: true,
        }))

        const transformedAddOns: AddOn[] = addons.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.name,
          baseCost: item.baseCost,
          marginType: (item.marginType as "fixed" | "percentage") || "fixed",
          marginAmount: item.marginAmount || 0,
          enabled: true,
        }))

        const transformedMaterials: Material[] = materials.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: "",
          description: item.name,
          costPerUnit: item.cost,
          unit: item.unit || "each",
          defaultQty: 1,
        }))

        const transformedLaborRates: LaborRate[] = laborRates.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.name,
          rate: item.rate,
          isDefault: false,
        }))

        const transformedPermitFees: PermitFee[] = permits.map((item: any) => ({
          id: item.id,
          name: item.name,
          tonnageRange: "",
          fee: item.cost,
        }))

        const transformedUnits: PriceBookUnit[] = units.map((item: any) => ({
          id: item.id,
          name: `${item.brand} ${item.model}`,
          tier: (item.tier as "good" | "better" | "best") || "good",
          tonnage: item.tonnage || 0,
          equipmentCost: item.baseCost,
          installLaborHours: 8,
          seerRating: 16,
          brand: item.brand,
          modelNumber: item.model,
          leadTimeDays: 3,
          systemType: "Air Conditioner",
        }))

        // Transform financing options - merge API data with default Lightreach leases
        const apiFinancing = financing.map((item: any) => ({
          id: item.id,
          name: item.name,
          type: (item.type as "cash" | "finance" | "lease") || "finance",
          termMonths: 0,
          apr: item.apr || 0,
          dealerFee: 0,
          description: "",
          available: true,
          provider: undefined,
        }))

        // Always include default Lightreach leases
        const defaultLeases = defaultFinancingOptions.filter(
          (opt) => opt.type === "lease" && opt.provider === "Lightreach",
        )
        const transformedFinancing = [...apiFinancing, ...defaultLeases]

        // Load settings from company settings JSON
        const settings: PricingSettings = company?.settings?.pricing || defaultSettings

        // Only update if we have data from API
        if (systems.length > 0 || addons.length > 0 || materials.length > 0) {
          setPriceBook({
            ...defaultPriceBook,
            hvacSystems: transformedSystems.length > 0 ? transformedSystems : defaultPriceBook.hvacSystems,
            addOns: transformedAddOns.length > 0 ? transformedAddOns : defaultPriceBook.addOns,
            materials: transformedMaterials.length > 0 ? transformedMaterials : defaultPriceBook.materials,
            laborRates: transformedLaborRates.length > 0 ? transformedLaborRates : defaultPriceBook.laborRates,
            permitFees: transformedPermitFees.length > 0 ? transformedPermitFees : defaultPriceBook.permitFees,
            units: transformedUnits.length > 0 ? transformedUnits : defaultPriceBook.units,
            financingOptions: transformedFinancing,
            settings,
          })
        }
      } catch (error) {
        console.error("Failed to load price book from API", error)
      } finally {
        setLoading(false)
      }
    }
    loadPriceBook()
  }, [])

  // Calculate system sales price
  const getSystemSalesPrice = (system: HVACSystem): number => {
    if (system.marginType === "fixed") {
      return system.baseCost + system.marginAmount
    }
    return Math.round(system.baseCost * (1 + system.marginAmount / 100))
  }

  // Calculate system gross profit
  const getSystemGrossProfit = (system: HVACSystem): number => {
    if (system.marginType === "fixed") {
      return system.marginAmount
    }
    return Math.round(system.baseCost * (system.marginAmount / 100))
  }

  // Calculate system markup percent
  const getSystemMarkupPercent = (system: HVACSystem): number => {
    const profit = getSystemGrossProfit(system)
    return Math.round((profit / system.baseCost) * 1000) / 10
  }

  // Calculate add-on sales price
  const getAddOnSalesPrice = (addon: AddOn): number => {
    if (addon.marginType === "fixed") {
      return addon.baseCost + addon.marginAmount
    }
    return Math.round(addon.baseCost * (1 + addon.marginAmount / 100))
  }

  // Calculate add-on gross profit
  const getAddOnGrossProfit = (addon: AddOn): number => {
    if (addon.marginType === "fixed") {
      return addon.marginAmount
    }
    return Math.round(addon.baseCost * (addon.marginAmount / 100))
  }

  // Calculate add-on markup percent
  const getAddOnMarkupPercent = (addon: AddOn): number => {
    const profit = getAddOnGrossProfit(addon)
    return Math.round((profit / addon.baseCost) * 1000) / 10
  }

  // Get default labor rate
  const getDefaultLaborRate = (): LaborRate | undefined => {
    return priceBook.laborRates.find((r) => r.isDefault)
  }

  // Calculate unit total cost
  const calculateUnitTotalCost = (unit: PriceBookUnit) => {
    const defaultRate = getDefaultLaborRate()
    const laborRate = defaultRate?.rate || 150
    const labor = unit.installLaborHours * laborRate

    const permit =
      priceBook.permitFees.find((p) => {
        if (unit.tonnage <= 2.5) return p.tonnageRange === "2-2.5 Ton"
        if (unit.tonnage <= 3.5) return p.tonnageRange === "3-3.5 Ton"
        return p.tonnageRange === "4-5 Ton"
      })?.fee || 200

    const subtotal = unit.equipmentCost + labor + permit
    const withOverhead = subtotal * priceBook.settings.overheadMultiplier
    const total = Math.round(withOverhead * (1 + priceBook.settings.profitMargin / 100))

    return { equipment: unit.equipmentCost, labor, permit, total }
  }

  // Get financing by type
  const getFinancingByType = (type: "cash" | "finance" | "lease"): FinancingOption[] => {
    const options = priceBook.financingOptions.filter((opt) => opt.type === type && opt.available)

    if (type === "lease") {
      return options.filter((opt) => opt.termMonths === 120 || opt.termMonths === 144)
    }

    return options
  }

  // Calculate monthly payment for financing
  const calculateMonthlyPayment = (principal: number, option: FinancingOption): number => {
    console.log("[v0] calculateMonthlyPayment called with:", { principal, option })

    if (option.type === "lease" && option.provider === "Lightreach") {
      const yearTerm = Math.floor(option.termMonths / 12)
      const escalator = option.name.includes("1.99%") ? "1.99%" : option.name.includes("0.99%") ? "0.99%" : "0%"

      if (yearTerm !== 10 && yearTerm !== 12) {
        console.error("[v0] Invalid lease term:", yearTerm, "- only 10 and 12 year terms are supported")
        return Number.NaN
      }

      const key = `${yearTerm}yr_${escalator}` as keyof typeof LIGHTREACH_PAYMENT_FACTORS
      const factor = LIGHTREACH_PAYMENT_FACTORS[key]

      if (!factor) {
        console.error("[v0] No payment factor found for:", key)
        return Number.NaN
      }

      const monthly = principal * factor
      console.log("[v0] LightReach calculation:", { yearTerm, escalator, key, factor, principal, monthly })
      return monthly
    }

    // Standard loan calculation with APR
    if (option.apr === 0) {
      return principal / option.termMonths
    }

    const monthlyRate = option.apr / 100 / 12
    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, option.termMonths)) /
      (Math.pow(1 + monthlyRate, option.termMonths) - 1)
    return Math.round(payment * 100) / 100
  }

  // HVAC System CRUD
  const updateHVACSystem = async (system: HVACSystem) => {
    try {
      const response = await fetch(`/api/company/hvac-systems/${system.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: system.name,
          tier: system.tier,
          baseCost: system.baseCost,
          marginType: system.marginType,
          marginAmount: system.marginAmount,
        }),
      })
      if (response.ok) {
        setPriceBook((prev) => ({
          ...prev,
          hvacSystems: prev.hvacSystems.map((s) => (s.id === system.id ? system : s)),
        }))
      }
    } catch (error) {
      console.error('Failed to update HVAC system', error)
    }
  }

  const addHVACSystem = async (system: Omit<HVACSystem, "id">) => {
    try {
      const response = await fetch('/api/company/hvac-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: system.name,
          tier: system.tier,
          baseCost: system.baseCost,
          marginType: system.marginType,
          marginAmount: system.marginAmount,
        }),
      })
      if (response.ok) {
        const newSystem = await response.json()
        setPriceBook((prev) => ({
          ...prev,
          hvacSystems: [...prev.hvacSystems, { ...system, id: newSystem.id }],
        }))
      }
    } catch (error) {
      console.error('Failed to add HVAC system', error)
    }
  }

  const deleteHVACSystem = async (id: string) => {
    try {
      const response = await fetch(`/api/company/hvac-systems/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setPriceBook((prev) => ({
          ...prev,
          hvacSystems: prev.hvacSystems.filter((s) => s.id !== id),
        }))
      }
    } catch (error) {
      console.error('Failed to delete HVAC system', error)
    }
  }

  // Add-on CRUD
  const updateAddOn = async (addon: AddOn) => {
    try {
      const response = await fetch(`/api/company/addons/${addon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addon.name,
          baseCost: addon.baseCost,
          marginType: addon.marginType,
          marginAmount: addon.marginAmount,
        }),
      })
      if (response.ok) {
        setPriceBook((prev) => ({
          ...prev,
          addOns: prev.addOns.map((a) => (a.id === addon.id ? addon : a)),
        }))
      }
    } catch (error) {
      console.error('Failed to update add-on', error)
    }
  }

  const addAddOn = async (addon: Omit<AddOn, "id">) => {
    try {
      const response = await fetch('/api/company/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addon.name,
          baseCost: addon.baseCost,
          marginType: addon.marginType,
          marginAmount: addon.marginAmount,
        }),
      })
      if (response.ok) {
        const newAddon = await response.json()
        setPriceBook((prev) => ({
          ...prev,
          addOns: [...prev.addOns, { ...addon, id: newAddon.id }],
        }))
      }
    } catch (error) {
      console.error('Failed to add add-on', error)
    }
  }

  const deleteAddOn = async (id: string) => {
    try {
      const response = await fetch(`/api/company/addons/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setPriceBook((prev) => ({
          ...prev,
          addOns: prev.addOns.filter((a) => a.id !== id),
        }))
      }
    } catch (error) {
      console.error('Failed to delete add-on', error)
    }
  }

  // Material CRUD
  const updateMaterial = async (material: Material) => {
    try {
      const response = await fetch(`/api/company/materials/${material.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: material.name,
          cost: material.costPerUnit,
          unit: material.unit,
        }),
      })
      if (response.ok) {
        setPriceBook((prev) => ({
          ...prev,
          materials: prev.materials.map((m) => (m.id === material.id ? material : m)),
        }))
      }
    } catch (error) {
      console.error('Failed to update material', error)
    }
  }

  const addMaterial = async (material: Omit<Material, "id">) => {
    try {
      const response = await fetch('/api/company/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: material.name,
          cost: material.costPerUnit,
          unit: material.unit,
        }),
      })
      if (response.ok) {
        const newMaterial = await response.json()
        setPriceBook((prev) => ({
          ...prev,
          materials: [...prev.materials, { ...material, id: newMaterial.id }],
        }))
      }
    } catch (error) {
      console.error('Failed to add material', error)
    }
  }

  const deleteMaterial = async (id: string) => {
    try {
      const response = await fetch(`/api/company/materials/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setPriceBook((prev) => ({
          ...prev,
          materials: prev.materials.filter((m) => m.id !== id),
        }))
      }
    } catch (error) {
      console.error('Failed to delete material', error)
    }
  }

  // Labor Rate CRUD
  const updateLaborRate = (rate: LaborRate) => {
    setPriceBook((prev) => ({
      ...prev,
      laborRates: prev.laborRates.map((r) => (r.id === rate.id ? rate : r)),
    }))
  }

  const addLaborRate = (rate: Omit<LaborRate, "id">) => {
    setPriceBook((prev) => ({
      ...prev,
      laborRates: [...prev.laborRates, { ...rate, id: Date.now().toString() }],
    }))
  }

  const deleteLaborRate = (id: string) => {
    setPriceBook((prev) => ({
      ...prev,
      laborRates: prev.laborRates.filter((r) => r.id !== id),
    }))
  }

  const setDefaultLaborRate = (id: string) => {
    setPriceBook((prev) => ({
      ...prev,
      laborRates: prev.laborRates.map((r) => ({ ...r, isDefault: r.id === id })),
    }))
  }

  // Permit Fee CRUD
  const updatePermitFee = (fee: PermitFee) => {
    setPriceBook((prev) => ({
      ...prev,
      permitFees: prev.permitFees.map((f) => (f.id === fee.id ? fee : f)),
    }))
  }

  const addPermitFee = (fee: Omit<PermitFee, "id">) => {
    setPriceBook((prev) => ({
      ...prev,
      permitFees: [...prev.permitFees, { ...fee, id: Date.now().toString() }],
    }))
  }

  const deletePermitFee = (id: string) => {
    setPriceBook((prev) => ({
      ...prev,
      permitFees: prev.permitFees.filter((f) => f.id !== id),
    }))
  }

  // Unit CRUD
  const updateUnit = (unit: PriceBookUnit) => {
    setPriceBook((prev) => ({
      ...prev,
      units: prev.units.map((u) => (u.id === unit.id ? unit : u)),
    }))
  }

  const addUnit = (unit: Omit<PriceBookUnit, "id">) => {
    setPriceBook((prev) => ({
      ...prev,
      units: [...prev.units, { ...unit, id: Date.now().toString() }],
    }))
  }

  const deleteUnit = (id: string) => {
    setPriceBook((prev) => ({
      ...prev,
      units: prev.units.filter((u) => u.id !== id),
    }))
  }

  // Financing CRUD
  const updateFinancingOption = (option: FinancingOption) => {
    setPriceBook((prev) => ({
      ...prev,
      financingOptions: prev.financingOptions.map((o) => (o.id === option.id ? option : o)),
    }))
  }

  const addFinancingOption = (option: Omit<FinancingOption, "id">) => {
    setPriceBook((prev) => ({
      ...prev,
      financingOptions: [...prev.financingOptions, { ...option, id: Date.now().toString() }],
    }))
  }

  const deleteFinancingOption = (id: string) => {
    setPriceBook((prev) => ({
      ...prev,
      financingOptions: prev.financingOptions.filter((o) => o.id !== id),
    }))
  }

  // Settings
  const updateSettings = async (settings: Partial<PricingSettings>) => {
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
              pricing: { ...priceBook.settings, ...settings },
            },
          }),
        })
      }
      setPriceBook((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...settings },
      }))
    } catch (error) {
      console.error('Failed to update settings', error)
    }
  }

  // Get tier price
  const getTierPrice = (tier: "good" | "better" | "best", tonnage: number): number => {
    const system = priceBook.hvacSystems.find((s) => s.tier === tier && s.enabled)
    if (system) {
      return getSystemSalesPrice(system)
    }
    return DEFAULT_TIER_PRICES[tier]
  }

  // Apply cash markup to sales price
  const getCustomerFacingPriceWithCashMarkup = (salesPrice: number, cashMarkupPercent: number): number => {
    return applyCashMarkup(salesPrice, cashMarkupPercent)
  }

  // Get customer-facing price (with cash markup)
  const getCustomerPrice = (salesPrice: number): number => {
    return applyCashMarkup(salesPrice, priceBook.settings.cashMarkup)
  }

  // Get system customer price
  const getSystemCustomerPrice = (tier: "good" | "better" | "best"): number => {
    const salesPrice = getTierPrice(tier, 0) // tonnage 0 gets base price
    return getCustomerPrice(salesPrice)
  }

  return (
    <PriceBookContext.Provider
      value={{
        priceBook,
        updateHVACSystem,
        addHVACSystem,
        deleteHVACSystem,
        getSystemSalesPrice,
        getSystemGrossProfit,
        getSystemMarkupPercent,
        getTierPrice,
        updateAddOn,
        addAddOn,
        deleteAddOn,
        getAddOnSalesPrice,
        getAddOnGrossProfit,
        getAddOnMarkupPercent,
        updateMaterial,
        addMaterial,
        deleteMaterial,
        updateLaborRate,
        addLaborRate,
        deleteLaborRate,
        setDefaultLaborRate,
        getDefaultLaborRate,
        updatePermitFee,
        addPermitFee,
        deletePermitFee,
        updateUnit,
        addUnit,
        deleteUnit,
        calculateUnitTotalCost,
        financingOptions: priceBook.financingOptions,
        updateFinancingOption,
        addFinancingOption,
        deleteFinancingOption,
        getFinancingByType,
        calculateMonthlyPayment,
        updateSettings,
        getCustomerFacingPriceWithCashMarkup,
        getCustomerPrice,
        getSystemCustomerPrice,
      }}
    >
      {children}
    </PriceBookContext.Provider>
  )
}

export function usePriceBook() {
  const context = useContext(PriceBookContext)
  if (!context) {
    throw new Error("usePriceBook must be used within a PriceBookProvider")
  }
  return context
}

// Helper function to calculate customer-facing price with cash markup
export function applyCashMarkup(salesPrice: number, cashMarkupPercent: number): number {
  return Math.round(salesPrice * (1 + cashMarkupPercent / 100) * 100) / 100
}
