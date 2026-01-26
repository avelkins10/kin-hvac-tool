"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  UserCircle,
  Home,
  Wind,
  Sun,
  Zap,
  Heart,
  Check,
  Send,
  RotateCcw,
  Settings,
  ChevronRight,
  ChevronLeft,
  Info,
  Camera,
  CheckCircle2,
  Sparkles,
  Package,
  Shield,
  Wrench,
  DollarSign,
  Download,
  AlertCircle,
  AlertTriangle,
  Edit,
  X,
} from "lucide-react"
import { usePriceBook, DEFAULT_TIER_PRICES, type FinancingOption } from "../contexts/PriceBookContext"
import { useMaintenance } from "../contexts/MaintenanceContext"
import { useIncentives } from "../contexts/IncentivesContext"
import { toast } from "sonner"
import { FinanceApplicationList } from "@/components/finance/FinanceApplicationList"
import { FinanceApplicationForm } from "@/components/finance/FinanceApplicationForm"
import { FinanceApplicationStatus } from "@/components/finance/FinanceApplicationStatus"
import { shouldShowFinanceApplication, extractCustomerDataFromProposal, getSystemPriceFromProposal } from "@/lib/finance-helpers"
import { StepNavigation } from "@/components/builder/StepNavigation"
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator"
import { HelpTooltip } from "@/components/builder/HelpTooltip"
import { AssessmentCompletionCard } from "@/components/builder/AssessmentCompletionCard"

async function resizeImageToJpeg(file: File, maxDim = 1600): Promise<File> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))

  const canvas = document.createElement("canvas")
  canvas.width = img.width * scale
  canvas.height = img.height * scale

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Cannot get canvas context")

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Image compression failed"))), "image/jpeg", 0.8)
  })

  return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
    type: "image/jpeg",
  })
}

// Types
type HotspotType = "customer" | "home" | "hvac" | "solar" | "electrical" | "preferences"

interface Hotspot {
  id: string // CHANGE: Changed type to string
  top: string // CHANGE: Added top property
  left: string // CHANGE: Added left property
  label: string
  icon: React.ReactNode
}

interface CustomerData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
}

interface HomeData {
  squareFootage: number
  yearBuilt: number
  stories: number
  bedrooms: number
  bathrooms: number
  hasAdditionsOrRemodeling: boolean
  additionsHaveDuctwork: boolean
}

interface HVACData {
  currentSystem: string
  systemAge: string // Changed to string to accommodate ranges
  hasDuctwork: boolean
  equipmentType: "auto" | "central" | "mini-split" | "package" | "package-rooftop" | "package-ground"
  issues: string[]
  lastServiced: string
  heatingType: string
  thermostatType: string
  zonesCount: number
  humidity: boolean
  airQuality: string
  noiseLevel: string
  hvacPlatePhoto?: string
  ductworkCondition: string
  ductworkAge: number
  climateZone: string
  // Added fields for AI analysis
  nameplatePhoto?: string
  coolingType?: string
  tonnage?: string
}

interface SolarData {
  interested: boolean
  hasSolarInstalled: boolean
  roofCondition: string
  shading: string
  electricBill: number
  roofAge: number
  roofMaterial: string
  roofDirection: string
  hasPreviousQuotes: boolean
  batteryInterest: boolean
  utilityCompany: string
  peakUsageTime: string
}

interface ElectricalData {
  panelSize: number
  hasCapacity: boolean
  needsUpgrade: boolean
  openBreakers: number
}

interface PreferencesData {
  priority: "comfort" | "efficiency" | "budget"
  financing: boolean
  timeline: string
  budgetRange: string
  brandPreference: string
  warrantyImportance: string
  environmentalConcern: boolean
  smartHomeIntegration: boolean
  noiseTolerrance: string
  allergies: boolean
  pets: boolean
  homeOccupancy: string
  decisionMaker: string
  competitorQuotes: boolean
}

interface SelectedEquipment {
  tier: "good" | "better" | "best"
  name: string
  salesPrice: number // The base price before customer markup
  price: number // The price shown to the customer
  baseCost: number // Added base cost for margin calculation
  seer: number
  features: string[]
  recommended?: boolean // Added recommended property
  tonnage?: number // Added tonnage for equipment selection
}

interface AddOn {
  id: string
  name: string
  price: number // Base price before customer markup
  description: string
  selected: boolean
}

// Hotspot definitions
// Updated hotspot definitions to match new interface and adjusted positions
const hotspots: Hotspot[] = [
  {
    id: "customer",
    top: "65%",
    left: "68%",
    label: "Customer Info",
    icon: <UserCircle className="w-5 h-5 md:w-8 md:h-8 text-white" />,
  },
  {
    id: "home",
    top: "32%",
    left: "45%",
    label: "Home Details",
    icon: <Home className="w-5 h-5 md:w-8 md:h-8 text-white" />,
  },
  {
    id: "hvac",
    top: "62%",
    left: "38%",
    label: "HVAC System",
    icon: <Wind className="w-5 h-5 md:w-8 md:h-8 text-white" />,
  },
  {
    id: "solar",
    top: "18%",
    left: "52%",
    label: "Solar Interest",
    icon: <Sun className="w-5 h-5 md:w-8 md:h-8 text-white" />,
  },
  {
    id: "electrical",
    top: "62%",
    left: "18%",
    label: "Electrical Panel",
    icon: <Zap className="w-5 h-5 md:w-8 md:h-8 text-white" />,
  },
  {
    id: "preferences",
    top: "47%",
    left: "62%",
    label: "Customer Preferences",
    icon: <Heart className="w-5 h-5 md:w-8 md:h-8 text-white" />,
  },
]

// Default add-ons
const defaultAddOns: AddOn[] = [
  {
    id: "1",
    name: "Smart Thermostat",
    price: 350,
    description: "WiFi-enabled programmable thermostat",
    selected: false,
  },
  {
    id: "2",
    name: "UV Air Purifier",
    price: 650,
    description: "Kills bacteria and viruses in ductwork",
    selected: false,
  },
  {
    id: "3",
    name: "Surge Protector",
    price: 199,
    description: "Protects HVAC equipment from power surges",
    selected: false,
  },
  { id: "4", name: "Duct Sealing", price: 450, description: "Seal leaks for improved efficiency", selected: false },
  {
    id: "5",
    name: "Extended Warranty",
    price: 499,
    description: "5-year extended parts and labor warranty",
    selected: false,
  },
  {
    id: "6",
    name: "Zoning System",
    price: 1200,
    description: "Control temperatures in different areas",
    selected: false,
  },
]

interface Props {
  onAdminAccess: () => void
  onSaveRef?: (saveFn: () => Promise<void>) => void
  onProposalIdChange?: (id: string | null) => void
}

export function InteractiveHouseAssessment({ onAdminAccess, onSaveRef, onProposalIdChange }: Props) {
  // View state
  const [showPricing, setShowPricing] = useState(false)
  const [pricingStep, setPricingStep] = useState<
    "equipment" | "addons" | "maintenance" | "incentives" | "payment" | "review"
  >("equipment")

  // Modal state
  const [activeModal, setActiveModal] = useState<HotspotType | null>(null)
  const [completedSections, setCompletedSections] = useState<Set<HotspotType>>(new Set())

  // Data state
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  })

  const [homeData, setHomeData] = useState<HomeData>({
    squareFootage: 2000,
    yearBuilt: 2000,
    stories: 1,
    bedrooms: 3,
    bathrooms: 2,
    hasAdditionsOrRemodeling: false,
    additionsHaveDuctwork: true,
  })

  const [hvacData, setHvacData] = useState<HVACData>({
    currentSystem: "central_ac",
    systemAge: "10", // Changed to string
    hasDuctwork: true,
    equipmentType: "auto",
    issues: [],
    lastServiced: "less_than_year",
    heatingType: "gas_furnace",
    thermostatType: "programmable",
    zonesCount: 1,
    humidity: false,
    airQuality: "none",
    noiseLevel: "normal",
    ductworkCondition: "good",
    ductworkAge: 10,
    climateZone: "3",
    // Added fields for AI analysis
    nameplatePhoto: undefined,
    coolingType: undefined,
    tonnage: undefined,
  })

  const [solarData, setSolarData] = useState<SolarData>({
    interested: false,
    hasSolarInstalled: false,
    roofCondition: "good",
    shading: "minimal",
    electricBill: 150,
    roofAge: 10,
    roofMaterial: "shingle",
    roofDirection: "south",
    hasPreviousQuotes: false,
    batteryInterest: false,
    utilityCompany: "",
    peakUsageTime: "afternoon",
  })

  const [electricalData, setElectricalData] = useState<ElectricalData>({
    panelSize: 200,
    hasCapacity: true,
    needsUpgrade: false,
    openBreakers: 4,
  })

  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    priority: "comfort",
    financing: true,
    timeline: "1-2 weeks",
    budgetRange: "flexible",
    brandPreference: "no_preference",
    warrantyImportance: "very",
    environmentalConcern: false,
    smartHomeIntegration: false,
    noiseTolerrance: "average",
    allergies: false,
    pets: false,
    homeOccupancy: "always",
    decisionMaker: "yes",
    competitorQuotes: false,
  })

  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment | null>(null)
  const [addOns, setAddOns] = useState<AddOn[]>(defaultAddOns)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "financing" | "leasing">("leasing")
  const [selectedFinancingOption, setSelectedFinancingOption] = useState<FinancingOption | null>(null)
  const [showProposalActions, setShowProposalActions] = useState(false) // State to control proposal actions visibility
  const [proposalId, setProposalId] = useState<string | null>(null) // Store proposal ID for edits
  const [showFinanceForm, setShowFinanceForm] = useState(false) // State for finance application form
  const [selectedFinanceApplicationId, setSelectedFinanceApplicationId] = useState<string | null>(null) // Selected finance application to view

  // Auto-save state
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Step navigation
  const pricingSteps: string[] = ["equipment", "addons", "maintenance", "incentives", "payment", "review"]
  const stepLabels: Record<string, string> = {
    equipment: "Equipment",
    addons: "Add-ons",
    maintenance: "Maintenance",
    incentives: "Incentives",
    payment: "Payment",
    review: "Review"
  }
  const estimatedTimes: Record<string, number> = {
    equipment: 3,
    addons: 2,
    maintenance: 2,
    incentives: 1,
    payment: 2,
    review: 1
  }

  // Expose save function and proposalId to parent
  useEffect(() => {
    if (onSaveRef) {
      onSaveRef(handleSendToKin)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSaveRef])

  useEffect(() => {
    if (onProposalIdChange) {
      onProposalIdChange(proposalId)
    }
  }, [proposalId, onProposalIdChange])

  // AI Analysis State
  const [analyzingNameplate, setAnalyzingNameplate] = useState(false)
  const [nameplateAnalysis, setNameplateAnalysis] = useState<{
    brand?: string | null
    modelNumber?: string | null
    serialNumber?: string | null
    coolingCapacityBTU?: number | null
    heatingCapacityBTU?: number | null
    seerRating?: number | null
    voltage?: string | null
    refrigerantType?: string | null
    estimatedAge?: string | null
    unitType?: string | null
    tonnage?: number | null
    additionalNotes?: string | null
    salesRoast?: string | null
    replacementSuggestion?: string | null
    parseError?: boolean
    error?: string // Added for general errors
    rawText?: string // Added for raw response from API
  } | null>(null)

  // Contexts
  const { getTierPrice, financingOptions, calculateMonthlyPayment, getCustomerPrice } = usePriceBook()
  const { plans, selectedPlan, setSelectedPlan, getPlanSalesPrice, getPlanMonthlyPrice } = useMaintenance()
  const { incentives, selectedIncentives, toggleIncentive, getTotalIncentives } = useIncentives()

  useEffect(() => {
    if (paymentMethod === "leasing" && !selectedFinancingOption && financingOptions) {
      const leasingOptions = financingOptions.filter((opt) => opt.type === "lease" && opt.available)
      if (leasingOptions.length > 0) {
        const defaultLightreach = leasingOptions.find(
          (opt) => opt.provider === "Lightreach" && opt.termMonths === 144 && opt.name.includes("0.99%"),
        )
        setSelectedFinancingOption(defaultLightreach || leasingOptions[0])
      }
    }
  }, [paymentMethod, financingOptions, selectedFinancingOption])

  // Mark section complete
  const markComplete = (section: HotspotType) => {
    setCompletedSections((prev) => new Set([...prev, section]))
    setActiveModal(null)
  }

  // Reset assessment data
  const resetAssessment = () => {
    setHomeData({
      squareFootage: 2000,
      yearBuilt: 2000,
      stories: 1,
      bedrooms: 3,
      bathrooms: 2,
      hasAdditionsOrRemodeling: false,
      additionsHaveDuctwork: true,
    })
    setHvacData({
      // Updated to use new HVACData interface
      currentSystem: "central_ac",
      systemAge: "10", // Reset to default string value
      hasDuctwork: true,
      equipmentType: "auto",
      issues: [],
      lastServiced: "less_than_year",
      heatingType: "gas_furnace",
      thermostatType: "programmable",
      zonesCount: 1,
      humidity: false,
      airQuality: "none",
      noiseLevel: "normal",
      ductworkCondition: "good",
      ductworkAge: 10,
      climateZone: "3",
      nameplatePhoto: undefined,
      coolingType: undefined,
      tonnage: undefined,
    })
    setSolarData({
      interested: false,
      hasSolarInstalled: false,
      roofCondition: "good",
      shading: "minimal",
      electricBill: 150,
      roofAge: 10,
      roofMaterial: "shingle",
      roofDirection: "south",
      hasPreviousQuotes: false,
      batteryInterest: false,
      utilityCompany: "",
      peakUsageTime: "afternoon",
    })
    setElectricalData({
      panelSize: 200,
      hasCapacity: true,
      needsUpgrade: false,
      openBreakers: 4,
    })
    setPreferencesData({
      priority: "comfort",
      financing: true,
      timeline: "1-2 weeks",
      budgetRange: "flexible",
      brandPreference: "no_preference",
      warrantyImportance: "very",
      environmentalConcern: false,
      smartHomeIntegration: false,
      noiseTolerrance: "average",
      allergies: false,
      pets: false,
      homeOccupancy: "always",
      decisionMaker: "yes",
      competitorQuotes: false,
    })
    setSelectedEquipment(null)
    setAddOns(defaultAddOns)
    setPaymentMethod("leasing")
    setSelectedFinancingOption(null)
    setSelectedPlan(null)
    // Reset AI analysis state
    setNameplateAnalysis(null)
    setAnalyzingNameplate(false)
  }

  // /** CHANGE: Enhanced tonnage calculation considering insulation and climate */
  const calculateTonnage = (): number => {
    const sqft = homeData.squareFootage

    // Base calculation
    let baseTonnage = 2
    if (sqft <= 1200) baseTonnage = 2
    else if (sqft <= 1500) baseTonnage = 2.5
    else if (sqft <= 1800) baseTonnage = 3
    else if (sqft <= 2100) baseTonnage = 3.5
    else if (sqft <= 2400) baseTonnage = 4
    else if (sqft <= 3000) baseTonnage = 5
    else baseTonnage = 5

    // Adjustments based on insulation - assuming poor insulation adds load
    // This would need to be captured in homeData, but we can infer from age
    if (homeData.yearBuilt < 1990) {
      baseTonnage += 0.5 // Older homes typically have poorer insulation
    }

    // Adjustments based on stories (multi-story homes may need more capacity)
    if (homeData.stories > 2) {
      baseTonnage += 0.5
    }

    // Adjustments for additions/remodeling
    if (homeData.hasAdditionsOrRemodeling) {
      baseTonnage += 0.5 // Assume additions add load
    }

    // Adjustments for climate zone
    const climateZone = Number.parseInt(hvacData.climateZone)
    if (!isNaN(climateZone)) {
      if (climateZone >= 4) {
        baseTonnage += 0.5 // Warmer climates might need more capacity
      }
      if (climateZone <= 2) {
        baseTonnage += 0.5 // Hotter/more humid climates
      }
    }

    // Round to nearest 0.5
    return Math.round(baseTonnage * 2) / 2
  }

  // /** CHANGE: New function to determine recommended tier based on all inputs */
  const getRecommendedTier = (): "good" | "better" | "best" => {
    let score = 0

    // Priority influence
    if (preferencesData.priority === "efficiency") score += 2
    else if (preferencesData.priority === "comfort") score += 1
    else if (preferencesData.priority === "budget") score -= 1

    // Budget range influence
    const budget = preferencesData.budgetRange
    if (budget === "under_8000")
      score -= 2 // Adjusted from "<10000"
    else if (budget === "8000-10000")
      score -= 1 // Added new range
    else if (budget === "10000-15000") score += 0
    else if (budget === "15000-20000") score += 1
    else if (budget === "over_20000") score += 2 // Adjusted from ">20000"

    // Environmental concern
    if (preferencesData.environmentalConcern) score += 1

    // Solar integration - higher efficiency makes sense with solar
    if (solarData.interested || solarData.hasSolarInstalled) score += 1

    // High electric bill suggests efficiency focus
    if (solarData.electricBill > 200) score += 1

    // Warranty importance
    if (preferencesData.warrantyImportance === "very") score += 1

    // Ductwork condition - poor ductwork might influence choice if not addressed
    if (hvacData.hasDuctwork && hvacData.ductworkCondition === "poor") {
      score -= 1 // May need a more robust system if ductwork is bad and won't be fixed
    }

    // Map score to tier
    if (score >= 3) return "best"
    if (score >= 0) return "better"
    return "good"
  }

  // /** CHANGE: New function to filter equipment tiers based on budget */
  const shouldShowTier = (tier: "good" | "better" | "best"): boolean => {
    const budget = preferencesData.budgetRange

    if (budget === "under_8000") {
      // Adjusted from "<10000"
      return tier === "good"
    } else if (budget === "8000-10000") {
      // Added new range
      return tier === "good"
    } else if (budget === "10000-15000") {
      return tier === "good" || tier === "better"
    }
    // For 15000-20000 and >20000, show all tiers
    return true
  }

  // /** CHANGE: Updated equipment tiers to use customer-facing prices with cash markup */
  const getEquipmentTiers = (tonnage: number): SelectedEquipment[] => {
    // const tonnage = calculateTonnage() // Tonnage is now a parameter
    const recommendedTier = getRecommendedTier()

    // Placeholder for base cost - this would ideally come from a pricing API or database
    const getBaseCost = (tier: "good" | "better" | "best", tonnage: number): number => {
      let base = 0
      switch (tier) {
        case "good":
          base = tonnage * 1200
          break
        case "better":
          base = tonnage * 1500
          break
        case "best":
          base = tonnage * 1800
          break
      }
      // Add a small variation based on tonnage
      return base * (1 + (tonnage - 2) * 0.05)
    }

    const allTiers = [
      {
        tier: "good" as const,
        name: "Essential Comfort",
        salesPrice: getTierPrice("good", tonnage) || DEFAULT_TIER_PRICES.good,
        price: getCustomerPrice(getTierPrice("good", tonnage) || DEFAULT_TIER_PRICES.good),
        baseCost: getBaseCost("good", tonnage), // Added base cost
        seer: 16,
        features: ["16 SEER efficiency", "Reliable performance", "5-year warranty", "Standard operation"],
        recommended: recommendedTier === "good",
        tonnage: tonnage,
      },
      {
        tier: "better" as const,
        name: "Premium Comfort",
        salesPrice: getTierPrice("better", tonnage) || DEFAULT_TIER_PRICES.better,
        price: getCustomerPrice(getTierPrice("better", tonnage) || DEFAULT_TIER_PRICES.better),
        baseCost: getBaseCost("better", tonnage), // Added base cost
        seer: 18,
        features: [
          "18 SEER high efficiency",
          "Quieter operation",
          "10-year warranty",
          "Better humidity control",
          "Energy savings",
        ],
        recommended: recommendedTier === "better",
        tonnage: tonnage,
      },
      {
        tier: "best" as const,
        name: "Ultimate Comfort",
        salesPrice: getTierPrice("best", tonnage) || DEFAULT_TIER_PRICES.best,
        price: getCustomerPrice(getTierPrice("best", tonnage) || DEFAULT_TIER_PRICES.best),
        baseCost: getBaseCost("best", tonnage), // Added base cost
        seer: 20,
        features: [
          "20 SEER maximum efficiency",
          "Whisper quiet",
          "12-year warranty",
          "Variable speed technology",
          "Smart home ready",
          "Maximum energy savings",
        ],
        recommended: recommendedTier === "best",
        tonnage: tonnage,
      },
    ]

    // Filter based on budget
    return allTiers.filter((tier) => shouldShowTier(tier.tier))
  }

  // /** CHANGE: New function to get recommendation reasons for display */
  const getRecommendationReason = (): string => {
    const reasons: string[] = []

    if (preferencesData.priority === "efficiency") {
      reasons.push("your focus on energy efficiency")
    } else if (preferencesData.priority === "comfort") {
      reasons.push("your comfort priorities")
    } else if (preferencesData.priority === "budget") {
      reasons.push("your budget focus")
    }

    if (solarData.interested || solarData.hasSolarInstalled) {
      reasons.push("solar integration benefits")
    }

    if (preferencesData.environmentalConcern) {
      reasons.push("environmental goals")
    }

    if (solarData.electricBill > 200) {
      reasons.push("current energy costs")
    }

    if (hvacData.hasDuctwork && hvacData.ductworkCondition === "poor") {
      reasons.push("ductwork condition")
    }

    if (reasons.length === 0) return "your home's needs"
    if (reasons.length === 1) return reasons[0]
    if (reasons.length === 2) return `${reasons[0]} and ${reasons[1]}`

    return `${reasons.slice(0, -1).join(", ")}, and ${reasons[reasons.length - 1]}`
  }

  // /** CHANGE: Calculate totals using customer-facing prices */
  const getAddOnsTotal = () => addOns.filter((a) => a.selected).reduce((sum, a) => getCustomerPrice(a.price), 0)
  const getMaintenanceTotal = () => {
    if (!selectedPlan) return 0
    const salesPrice = getPlanSalesPrice(selectedPlan)
    return getCustomerPrice(salesPrice)
  }
  const getSubtotal = () => (selectedEquipment?.price || 0) + getAddOnsTotal() + getMaintenanceTotal()
  const getTotal = () => getSubtotal() - getTotalIncentives()

  // Toggle add-on selection
  const toggleAddOn = (id: string) => {
    setAddOns((prev) => prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a)))
  }

  // Handle start over
  const handleStartOver = () => {
    setShowPricing(false)
    setPricingStep("equipment")
    setCompletedSections(new Set())
    setSelectedEquipment(null)
    setAddOns(defaultAddOns)
    setSelectedPlan(null)
    // Reset payment method and financing selection
    setPaymentMethod("leasing")
    setSelectedFinancingOption(null)
    setCustomerData({ name: "", email: "", phone: "", address: "", city: "", state: "", zip: "" })
    // Call the new reset function
    resetAssessment()
    setShowProposalActions(false) // Hide proposal actions when starting over
  }

  // Validation functions
  const validateStep = (step: string): boolean => {
    const errors: Record<string, string> = {}
    
    if (step === "equipment" && !selectedEquipment) {
      errors.equipment = "Please select an equipment option"
    }
    
    if (step === "payment" && paymentMethod !== "cash" && !selectedFinancingOption) {
      errors.payment = "Please select a financing option"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const canProceedToNextStep = (): boolean => {
    return validateStep(pricingStep)
  }

  // Step navigation functions
  const goToNextStep = () => {
    if (!canProceedToNextStep()) {
      return
    }
    const currentIndex = pricingSteps.indexOf(pricingStep)
    if (currentIndex < pricingSteps.length - 1) {
      setPricingStep(pricingSteps[currentIndex + 1])
      setValidationErrors({})
    }
  }

  const goToPreviousStep = () => {
    const currentIndex = pricingSteps.indexOf(pricingStep)
    if (currentIndex > 0) {
      setPricingStep(pricingSteps[currentIndex - 1])
      setValidationErrors({})
    }
  }

  const goToStep = (step: string) => {
    const currentIndex = pricingSteps.indexOf(pricingStep)
    const targetIndex = pricingSteps.indexOf(step)
    // Only allow jumping to completed steps or next step
    if (targetIndex <= currentIndex || targetIndex === currentIndex + 1) {
      setPricingStep(step as "equipment" | "addons" | "maintenance" | "incentives" | "payment" | "review")
      setValidationErrors({})
    }
  }

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!proposalId) return // Don't auto-save if no proposal exists yet
    
    setIsAutoSaving(true)
    setSaveError(null)
    
    try {
      const proposalData = {
        customerData,
        homeData,
        hvacData,
        solarData,
        electricalData,
        preferencesData,
        selectedEquipment,
        addOns: addOns.filter((a) => a.selected),
        maintenancePlan: selectedPlan,
        incentives: selectedIncentives,
        paymentMethod: {
          method: paymentMethod,
          option: paymentMethod === "cash" ? null : selectedFinancingOption,
        },
        financingOption: paymentMethod === "cash" ? null : selectedFinancingOption,
        totals: {
          equipment: selectedEquipment?.price || 0,
          addOns: getAddOnsTotal(),
          maintenance: getMaintenanceTotal(),
          incentives: getTotalIncentives(),
          total: getTotal(),
        },
        nameplateAnalysis: nameplateAnalysis,
      }

      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposalData),
      })

      if (response.ok) {
        setLastSaved(new Date())
        setSaveError(null)
      } else {
        throw new Error('Failed to auto-save')
      }
    } catch (error) {
      setSaveError("Auto-save failed")
    } finally {
      setIsAutoSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId, customerData, homeData, hvacData, solarData, electricalData, preferencesData, selectedEquipment, addOns, selectedPlan, selectedIncentives, paymentMethod, selectedFinancingOption, nameplateAnalysis])

  // Auto-save effect - debounced
  useEffect(() => {
    if (proposalId && showPricing) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave()
      }, 3000) // Auto-save after 3 seconds of inactivity

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId, showPricing, customerData, homeData, hvacData, selectedEquipment, addOns, selectedPlan, selectedIncentives, paymentMethod, selectedFinancingOption])

  // Keyboard shortcuts
  useEffect(() => {
    if (!showPricing) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Arrow keys for navigation
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault()
        goToNextStep()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPreviousStep()
      }
      // Ctrl/Cmd + S to save
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSendToKin()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showPricing, pricingStep])

  // Handle send to Kin - Save proposal via API
  const handleSendToKin = async () => {
    const proposalData = {
      customerData,
      homeData,
      hvacData,
      solarData,
      electricalData,
      preferencesData,
      selectedEquipment,
      addOns: addOns.filter((a) => a.selected),
      maintenancePlan: selectedPlan,
      incentives: selectedIncentives,
      paymentMethod: {
        method: paymentMethod,
        option: paymentMethod === "cash" ? null : selectedFinancingOption,
      },
      financingOption: paymentMethod === "cash" ? null : selectedFinancingOption,
      totals: {
        equipment: selectedEquipment?.price || 0,
        addOns: getAddOnsTotal(),
        maintenance: getMaintenanceTotal(),
        incentives: getTotalIncentives(),
        total: getTotal(),
      },
      nameplateAnalysis: nameplateAnalysis,
    }

    try {
      setIsAutoSaving(true)
      setSaveError(null)
      let savedProposal
      if (proposalId) {
        // Update existing proposal
        const response = await fetch(`/api/proposals/${proposalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(proposalData),
        })
        if (response.ok) {
          savedProposal = await response.json()
          setLastSaved(new Date())
          toast.success("Proposal updated successfully!")
        } else {
          throw new Error('Failed to update proposal')
        }
      } else {
        // Create new proposal
        const response = await fetch('/api/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(proposalData),
        })
        if (response.ok) {
          savedProposal = await response.json()
          setProposalId(savedProposal.id)
          setLastSaved(new Date())
          toast.success("Proposal saved successfully!")
          // Update proposalId in parent component
          if (onProposalIdChange) {
            onProposalIdChange(savedProposal.id)
          }
        } else {
          throw new Error('Failed to create proposal')
        }
      }
    } catch (error) {
      setSaveError("Failed to save proposal")
      toast.error("Failed to save proposal")
    } finally {
      setIsAutoSaving(false)
    }
  }

  // Handle admin access
  const handleAdminClick = () => {
    const password = prompt("Enter admin password:")
    if (password === "fullsend") {
      onAdminAccess()
    } else if (password) {
      toast.error("Invalid password")
    }
  }

  // Get modal title
  const getModalTitle = (type: HotspotType): string => {
    const titles: Record<HotspotType, string> = {
      customer: "Customer Information",
      home: "Home Details",
      hvac: "HVAC System",
      solar: "Solar Interest",
      electrical: "Electrical Panel",
      preferences: "Customer Preferences",
    }
    return titles[type]
  }

  // Render modal content
  const renderModalContent = () => {
    switch (activeModal) {
      case "customer":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={customerData.address}
                onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={customerData.city}
                  onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={customerData.state}
                  onChange={(e) => setCustomerData({ ...customerData, state: e.target.value })}
                  placeholder="FL"
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={customerData.zip}
                  onChange={(e) => setCustomerData({ ...customerData, zip: e.target.value })}
                  placeholder="12345"
                />
              </div>
            </div>
            <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => markComplete("customer")}>
              Save Customer Info
            </Button>
          </div>
        )

      case "home":
        return (
          <div className="space-y-4">
            <div>
              <Label>Square Footage: {homeData.squareFootage} sq ft</Label>
              <Slider
                value={[homeData.squareFootage]}
                onValueChange={([v]) => setHomeData({ ...homeData, squareFootage: v })}
                min={500}
                max={6000}
                step={100}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Year Built: {homeData.yearBuilt}</Label>
                <Slider
                  value={[homeData.yearBuilt]}
                  onValueChange={([v]) => setHomeData({ ...homeData, yearBuilt: v })}
                  min={1900}
                  max={2024}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Stories: {homeData.stories}</Label>
                <Slider
                  value={[homeData.stories]}
                  onValueChange={([v]) => setHomeData({ ...homeData, stories: v })}
                  min={1}
                  max={3}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bedrooms: {homeData.bedrooms}</Label>
                <Slider
                  value={[homeData.bedrooms]}
                  onValueChange={([v]) => setHomeData({ ...homeData, bedrooms: v })}
                  min={1}
                  max={8}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Bathrooms: {homeData.bathrooms}</Label>
                <Slider
                  value={[homeData.bathrooms]}
                  onValueChange={([v]) => setHomeData({ ...homeData, bathrooms: v })}
                  min={1}
                  max={6}
                  step={0.5}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasAdditionsOrRemodeling"
                  checked={homeData.hasAdditionsOrRemodeling}
                  onCheckedChange={(v) =>
                    setHomeData({
                      ...homeData,
                      hasAdditionsOrRemodeling: v as boolean,
                    })
                  }
                />
                <Label htmlFor="hasAdditionsOrRemodeling">Home has additions or remodeled areas</Label>
              </div>

              {homeData.hasAdditionsOrRemodeling && (
                <div className="ml-6 flex items-center gap-2">
                  <Checkbox
                    id="additionsHaveDuctwork"
                    checked={homeData.additionsHaveDuctwork}
                    onCheckedChange={(v) =>
                      setHomeData({
                        ...homeData,
                        additionsHaveDuctwork: v as boolean,
                      })
                    }
                  />
                  <Label htmlFor="additionsHaveDuctwork" className="text-sm">
                    These areas have ductwork
                  </Label>
                </div>
              )}
            </div>

            <Button className="w-full bg-green-500 hover:bg-green-600" onClick={() => markComplete("home")}>
              Save Home Details
            </Button>
          </div>
        )

      case "hvac":
        // CHANGE: handleNameplateUpload function updated with new fetch call and error handling
        const handleNameplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
          const originalFile = event.target.files?.[0]
          if (!originalFile) return

          setAnalyzingNameplate(true)
          setNameplateAnalysis(null)

          try {
            // Resize/compress the image to avoid payload size issues
            const file = await resizeImageToJpeg(originalFile, 1600)

            // Read the compressed file as base64
            const arrayBuffer = await file.arrayBuffer()
            const base64Data = btoa(
              new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
            )

            // Show preview
            const previewUrl = `data:${file.type};base64,${base64Data}`
            setHvacData({ ...hvacData, nameplatePhoto: previewUrl })

            const response = await fetch("/api/analyze-nameplate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                file: {
                  data: base64Data,
                  mediaType: file.type,
                  filename: file.name,
                },
              }),
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || data.detail || `HTTP ${response.status}`)
            }

            if (data.success && data.data) {
              setNameplateAnalysis(data.data)
              setHvacData((prev) => ({
                ...prev,
                tonnage: data.data.tonnage ? String(data.data.tonnage) : prev.tonnage,
                coolingType: data.data.unitType || prev.coolingType,
              }))
            } else {
              setNameplateAnalysis({ parseError: true, rawText: data.rawResponse })
            }
          } catch (error: unknown) {
            console.error("AI Nameplate Analysis Failed:", error)
            const errorMessage = error instanceof Error ? error.message : "Unknown error"

            if (errorMessage === "Load failed" || errorMessage === "Failed to fetch") {
              setNameplateAnalysis({
                parseError: true,
                error: "The image upload failed - please try again with a closer, cropped photo of just the nameplate.",
              })
            } else {
              setNameplateAnalysis({ parseError: true, error: `API error: ${errorMessage}` })
            }
          } finally {
            setAnalyzingNameplate(false)
          }
        }

        return (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* CHANGE: Update the nameplate upload section to show AI analysis results */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Upload HVAC Nameplate Photo (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Take a photo of your unit's data plate - AI will automatically extract system information
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.heic,.heif,image/heic,image/heif,image/webp,png,jpeg,jpg,gif"
                  capture="environment"
                  onChange={handleNameplateUpload}
                  className="flex-1"
                />
              </div>
              {hvacData.nameplatePhoto && (
                <div className="mt-2 space-y-3">
                  <img
                    src={hvacData.nameplatePhoto || "/placeholder.svg"}
                    alt="HVAC Nameplate"
                    className="max-w-full h-32 object-contain rounded border"
                  />
                  {analyzingNameplate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Analyzing nameplate with AI...
                    </div>
                  )}
                  {nameplateAnalysis && !nameplateAnalysis.parseError && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        AI Analysis Complete
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {nameplateAnalysis.brand && (
                          <div>
                            <span className="font-medium">Brand:</span> {nameplateAnalysis.brand}
                          </div>
                        )}
                        {nameplateAnalysis.modelNumber && (
                          <div>
                            <span className="font-medium">Model:</span> {nameplateAnalysis.modelNumber}
                          </div>
                        )}
                        {nameplateAnalysis.unitType && (
                          <div>
                            <span className="font-medium">Type:</span> {nameplateAnalysis.unitType}
                          </div>
                        )}
                        {nameplateAnalysis.tonnage && (
                          <div>
                            <span className="font-medium">Tonnage:</span> {nameplateAnalysis.tonnage} ton
                          </div>
                        )}
                        {nameplateAnalysis.seerRating && (
                          <div>
                            <span className="font-medium">SEER:</span> {nameplateAnalysis.seerRating}
                          </div>
                        )}
                        {nameplateAnalysis.estimatedAge && (
                          <div>
                            <span className="font-medium">Age:</span> {nameplateAnalysis.estimatedAge}
                          </div>
                        )}
                        {nameplateAnalysis.refrigerantType && (
                          <div>
                            <span className="font-medium">Refrigerant:</span> {nameplateAnalysis.refrigerantType}
                          </div>
                        )}
                        {nameplateAnalysis.voltage && (
                          <div>
                            <span className="font-medium">Voltage:</span> {nameplateAnalysis.voltage}
                          </div>
                        )}
                      </div>
                      {nameplateAnalysis.additionalNotes && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <span className="font-medium">Notes:</span> {nameplateAnalysis.additionalNotes}
                        </p>
                      )}

                      {nameplateAnalysis.salesRoast && (
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                          <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1">
                            Sales Ammo
                          </p>
                          <p className="text-sm italic text-gray-700 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                            "{nameplateAnalysis.salesRoast}"
                          </p>
                        </div>
                      )}

                      {nameplateAnalysis.replacementSuggestion && (
                        <div className="mt-2">
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                            Recommended Replacement
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            {nameplateAnalysis.replacementSuggestion}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {nameplateAnalysis?.parseError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Could not parse nameplate data. Please ensure the image is clear.
                      </p>
                      {nameplateAnalysis.error && (
                        <p className="text-xs text-red-600 mt-2">Error: {nameplateAnalysis.error}</p>
                      )}
                      {nameplateAnalysis.rawText && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                          <p className="font-medium">Raw Response:</p>
                          <pre className="overflow-x-auto">{nameplateAnalysis.rawText}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label>Current Cooling System</Label>
              <Select
                value={hvacData.currentSystem}
                onValueChange={(v) => setHvacData({ ...hvacData, currentSystem: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="central_ac">Central AC</SelectItem>
                  <SelectItem value="heat_pump">Heat Pump</SelectItem>
                  <SelectItem value="mini_split">Mini Split</SelectItem>
                  <SelectItem value="window_units">Window Units</SelectItem>
                  <SelectItem value="none">No AC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Current Heating System</Label>
              <Select value={hvacData.heatingType} onValueChange={(v) => setHvacData({ ...hvacData, heatingType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gas_furnace">Gas Furnace</SelectItem>
                  <SelectItem value="electric_furnace">Electric Furnace</SelectItem>
                  <SelectItem value="heat_pump">Heat Pump</SelectItem>
                  <SelectItem value="boiler">Boiler</SelectItem>
                  <SelectItem value="space_heaters">Space Heaters</SelectItem>
                  <SelectItem value="none">No Heating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>System Age</Label>
              <Select value={hvacData.systemAge} onValueChange={(v) => setHvacData({ ...hvacData, systemAge: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-5">0-5 years</SelectItem>
                  <SelectItem value="6-10">6-10 years</SelectItem>
                  <SelectItem value="11-15">11-15 years</SelectItem>
                  <SelectItem value="16-20">16-20 years</SelectItem>
                  <SelectItem value="20+">Over 20 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Last Professional Service</Label>
              <Select
                value={hvacData.lastServiced}
                onValueChange={(v) => setHvacData({ ...hvacData, lastServiced: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less_than_year">Less than 1 year ago</SelectItem>
                  <SelectItem value="1-2_years">1-2 years ago</SelectItem>
                  <SelectItem value="2-5_years">2-5 years ago</SelectItem>
                  <SelectItem value="over_5_years">Over 5 years ago</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ductwork"
                checked={hvacData.hasDuctwork}
                onCheckedChange={(v) => setHvacData({ ...hvacData, hasDuctwork: v as boolean })}
              />
              <Label htmlFor="ductwork">Home has existing ductwork</Label>
            </div>

            {hvacData.hasDuctwork && (
              <>
                <div>
                  <Label>Ductwork Condition</Label>
                  <Select
                    value={hvacData.ductworkCondition}
                    onValueChange={(v) => setHvacData({ ...hvacData, ductworkCondition: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent - Recently installed/sealed</SelectItem>
                      <SelectItem value="good">Good - No visible issues</SelectItem>
                      <SelectItem value="fair">Fair - Some visible wear</SelectItem>
                      <SelectItem value="poor">Poor - Leaks or damage</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Ductwork Age: {hvacData.ductworkAge} years</Label>
                  <Slider
                    value={[hvacData.ductworkAge]}
                    onValueChange={([v]) => setHvacData({ ...hvacData, ductworkAge: v })}
                    min={0}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            <div>
              <Label className="flex items-center gap-2">
                IECC Climate Zone
                <Info className="w-4 h-4 text-muted-foreground" />
              </Label>
              <Select value={hvacData.climateZone} onValueChange={(v) => setHvacData({ ...hvacData, climateZone: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Zone 1 - Very Hot/Humid (South FL, HI)</SelectItem>
                  <SelectItem value="2">Zone 2 - Hot/Humid (TX, LA, South)</SelectItem>
                  <SelectItem value="3">Zone 3 - Warm/Humid (Southeast)</SelectItem>
                  <SelectItem value="4">Zone 4 - Mixed (Mid-Atlantic, Lower Midwest)</SelectItem>
                  <SelectItem value="5">Zone 5 - Cool (Upper Midwest, New England)</SelectItem>
                  <SelectItem value="6">Zone 6 - Cold (Northern States)</SelectItem>
                  <SelectItem value="7">Zone 7 - Very Cold (North Dakota, Minnesota)</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
              {Number.parseInt(hvacData.climateZone) >= 4 && (
                <p className="text-xs text-orange-600 mt-1">
                  Zone 4+: Enhanced capacity heat pumps and/or dual fuel recommended
                </p>
              )}
            </div>

            <div>
              <Label>Current Thermostat Type</Label>
              <Select
                value={hvacData.thermostatType}
                onValueChange={(v) => setHvacData({ ...hvacData, thermostatType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual/Basic</SelectItem>
                  <SelectItem value="programmable">Programmable</SelectItem>
                  <SelectItem value="smart">Smart Thermostat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Number of Zones: {hvacData.zonesCount}</Label>
              <Slider
                value={[hvacData.zonesCount]}
                onValueChange={([v]) => setHvacData({ ...hvacData, zonesCount: v })}
                min={1}
                max={5}
                step={1}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="humidity"
                checked={hvacData.humidity}
                onCheckedChange={(v) => setHvacData({ ...hvacData, humidity: v as boolean })}
              />
              <Label htmlFor="humidity">Has humidity control (humidifier/dehumidifier)</Label>
            </div>

            <div>
              <Label>Current Air Quality</Label>
              <Select value={hvacData.airQuality} onValueChange={(v) => setHvacData({ ...hvacData, airQuality: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent - No issues</SelectItem>
                  <SelectItem value="good">Good - Minor dust</SelectItem>
                  <SelectItem value="average">Average - Some concerns</SelectItem>
                  <SelectItem value="poor">Poor - Significant issues</SelectItem>
                  <SelectItem value="none">No concerns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Current System Noise Level</Label>
              <Select value={hvacData.noiseLevel} onValueChange={(v) => setHvacData({ ...hvacData, noiseLevel: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiet">Quiet - Barely noticeable</SelectItem>
                  <SelectItem value="average">Average - Normal operation</SelectItem>
                  <SelectItem value="loud">Loud - Noticeably disruptive</SelectItem>
                  <SelectItem value="very_loud">Very Loud - Concerning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Current Issues (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { id: "not_cooling", label: "Not cooling properly" },
                  { id: "not_heating", label: "Not heating properly" },
                  { id: "high_bills", label: "High energy bills" },
                  { id: "uneven_temps", label: "Uneven temperatures" },
                  { id: "strange_noises", label: "Strange noises" },
                  { id: "bad_odors", label: "Bad odors" },
                  { id: "frequent_repairs", label: "Frequent repairs" },
                  { id: "short_cycling", label: "Short cycling" },
                ].map((issue) => (
                  <div key={issue.id} className="flex items-center gap-2">
                    <Checkbox
                      id={issue.id}
                      checked={hvacData.issues.includes(issue.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setHvacData({ ...hvacData, issues: [...hvacData.issues, issue.id] })
                        } else {
                          setHvacData({ ...hvacData, issues: hvacData.issues.filter((i) => i !== issue.id) })
                        }
                      }}
                    />
                    <Label htmlFor={issue.id} className="text-sm">
                      {issue.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Equipment Type Preference</Label>
              <Select
                value={hvacData.equipmentType}
                onValueChange={(v) => setHvacData({ ...hvacData, equipmentType: v as HVACData["equipmentType"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Recommended)</SelectItem>
                  <SelectItem value="central">Central AC/Heat Pump</SelectItem>
                  <SelectItem value="mini-split">Mini Split/Ductless</SelectItem>
                  <SelectItem value="package-rooftop">Package Unit - Rooftop</SelectItem>
                  <SelectItem value="package-ground">Package Unit - Ground Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => markComplete("hvac")}>
              Save HVAC Info
            </Button>
          </div>
        )

      case "solar":
        return (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* CHANGE: Added "already have solar" option */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasSolarInstalled"
                checked={solarData.hasSolarInstalled}
                onCheckedChange={(v) => setSolarData({ ...solarData, hasSolarInstalled: v as boolean })}
              />
              <Label htmlFor="hasSolarInstalled">Already have solar installed</Label>
            </div>

            <div>
              <Label>Roof Condition</Label>
              <Select
                value={solarData.roofCondition}
                onValueChange={(v) => setSolarData({ ...solarData, roofCondition: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent (0-5 years old)</SelectItem>
                  <SelectItem value="good">Good (5-15 years old)</SelectItem>
                  <SelectItem value="fair">Fair (15-20 years old)</SelectItem>
                  <SelectItem value="poor">Needs Replacement Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Roof Age: {solarData.roofAge} years</Label>
              <Slider
                value={[solarData.roofAge]}
                onValueChange={([v]) => setSolarData({ ...solarData, roofAge: v })}
                min={0}
                max={30}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Roof Material</Label>
              <Select
                value={solarData.roofMaterial}
                onValueChange={(v) => setSolarData({ ...solarData, roofMaterial: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shingle">Asphalt Shingle</SelectItem>
                  <SelectItem value="tile">Tile</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="flat">Flat/Built-up</SelectItem>
                  <SelectItem value="slate">Slate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Primary Roof Direction</Label>
              <Select
                value={solarData.roofDirection}
                onValueChange={(v) => setSolarData({ ...solarData, roofDirection: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="south">South (Best)</SelectItem>
                  <SelectItem value="southwest">Southwest</SelectItem>
                  <SelectItem value="southeast">Southeast</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="flat">Flat Roof</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Roof Shading</Label>
              <Select value={solarData.shading} onValueChange={(v) => setSolarData({ ...solarData, shading: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Shading</SelectItem>
                  <SelectItem value="minimal">Minimal (small trees/structures)</SelectItem>
                  <SelectItem value="moderate">Moderate (some shade during day)</SelectItem>
                  <SelectItem value="significant">Significant (large trees nearby)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Average Monthly Electric Bill: ${solarData.electricBill}</Label>
              <Slider
                value={[solarData.electricBill]}
                onValueChange={([v]) => setSolarData({ ...solarData, electricBill: v })}
                min={50}
                max={1000}
                step={25}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="utility">Utility Company</Label>
              <Input
                id="utility"
                value={solarData.utilityCompany}
                onChange={(e) => setSolarData({ ...solarData, utilityCompany: e.target.value })}
                placeholder="e.g., FPL, Duke Energy"
              />
            </div>

            <div>
              <Label>Peak Energy Usage Time</Label>
              <Select
                value={solarData.peakUsageTime}
                onValueChange={(v) => setSolarData({ ...solarData, peakUsageTime: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (6am-12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm-6pm)</SelectItem>
                  <SelectItem value="evening">Evening (6pm-10pm)</SelectItem>
                  <SelectItem value="night">Night (10pm-6am)</SelectItem>
                  <SelectItem value="all_day">All Day (Home always occupied)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="batteryInterest"
                checked={solarData.batteryInterest}
                onCheckedChange={(v) => setSolarData({ ...solarData, batteryInterest: v as boolean })}
              />
              <Label htmlFor="batteryInterest">Interested in battery storage</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="previousQuotes"
                checked={solarData.hasPreviousQuotes}
                onCheckedChange={(v) => setSolarData({ ...solarData, hasPreviousQuotes: v as boolean })}
              />
              <Label htmlFor="previousQuotes">Have received other solar quotes</Label>
            </div>

            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={() => markComplete("solar")}
            >
              Save Solar Info
            </Button>
          </div>
        )

      case "electrical":
        return (
          <div className="space-y-4">
            <div>
              <Label>Panel Size (Amps)</Label>
              <Select
                value={electricalData.panelSize.toString()}
                onValueChange={(v) => setElectricalData({ ...electricalData, panelSize: Number.parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 Amp</SelectItem>
                  <SelectItem value="150">150 Amp</SelectItem>
                  <SelectItem value="200">200 Amp</SelectItem>
                  <SelectItem value="400">400 Amp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CHANGE: Added open breakers field */}
            <div>
              <Label>Number of Open Breaker Spaces: {electricalData.openBreakers}</Label>
              <Slider
                value={[electricalData.openBreakers]}
                onValueChange={([v]) => setElectricalData({ ...electricalData, openBreakers: v })}
                min={0}
                max={20}
                step={1}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="capacity"
                checked={electricalData.hasCapacity}
                onCheckedChange={(v) => setElectricalData({ ...electricalData, hasCapacity: v as boolean })}
              />
              <Label htmlFor="capacity">Panel has available capacity for HVAC</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="upgrade"
                checked={electricalData.needsUpgrade}
                onCheckedChange={(v) => setElectricalData({ ...electricalData, needsUpgrade: v as boolean })}
              />
              <Label htmlFor="upgrade">Panel needs upgrade</Label>
            </div>

            <Button className="w-full bg-purple-500 hover:bg-purple-600" onClick={() => markComplete("electrical")}>
              Save Electrical Info
            </Button>
          </div>
        )

      case "preferences":
        return (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <Label>Top Priority</Label>
              <Select
                value={preferencesData.priority}
                onValueChange={(v) =>
                  setPreferencesData({ ...preferencesData, priority: v as PreferencesData["priority"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfort">Maximum Comfort</SelectItem>
                  <SelectItem value="efficiency">Energy Efficiency</SelectItem>
                  <SelectItem value="budget">Budget Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Budget Range</Label>
              <Select
                value={preferencesData.budgetRange}
                onValueChange={(v) => setPreferencesData({ ...preferencesData, budgetRange: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_8000">Under $8,000</SelectItem>
                  <SelectItem value="8000-10000">$8,000 - $10,000</SelectItem>
                  <SelectItem value="10000-15000">$10,000 - $15,000</SelectItem>
                  <SelectItem value="15000-20000">$15,000 - $20,000</SelectItem>
                  <SelectItem value="over_20000">Over $20,000</SelectItem>
                  <SelectItem value="flexible">Flexible / Not Sure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Find and replace the brand preference in preferences modal */}
            <div>
              <Label>Brand Preference</Label>
              <Select
                value={preferencesData.brandPreference}
                onValueChange={(v) => setPreferencesData({ ...preferencesData, brandPreference: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_preference">No Preference</SelectItem>
                  <SelectItem value="goodman">Goodman</SelectItem>
                  <SelectItem value="daikin">Daikin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Warranty Importance</Label>
              <Select
                value={preferencesData.warrantyImportance}
                onValueChange={(v) => setPreferencesData({ ...preferencesData, warrantyImportance: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very">Very Important - Want longest warranty</SelectItem>
                  <SelectItem value="somewhat">Somewhat Important</SelectItem>
                  <SelectItem value="not">Not a Major Factor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="financing"
                checked={preferencesData.financing}
                onCheckedChange={(v) => setPreferencesData({ ...preferencesData, financing: v as boolean })}
              />
              <Label htmlFor="financing">Interested in financing options</Label>
            </div>

            <div>
              <Label>Installation Timeline</Label>
              <Select
                value={preferencesData.timeline}
                onValueChange={(v) => setPreferencesData({ ...preferencesData, timeline: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">ASAP / Emergency</SelectItem>
                  <SelectItem value="1-2 weeks">1-2 Weeks</SelectItem>
                  <SelectItem value="1 month">Within a Month</SelectItem>
                  <SelectItem value="flexible">Flexible / Planning Ahead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="environmental"
                checked={preferencesData.environmentalConcern}
                onCheckedChange={(v) => setPreferencesData({ ...preferencesData, environmentalConcern: v as boolean })}
              />
              <Label htmlFor="environmental">Environmental impact is important to me</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="smartHome"
                checked={preferencesData.smartHomeIntegration}
                onCheckedChange={(v) => setPreferencesData({ ...preferencesData, smartHomeIntegration: v as boolean })}
              />
              <Label htmlFor="smartHome">Want smart home integration</Label>
            </div>

            <div>
              <Label>Noise Tolerance</Label>
              <Select
                value={preferencesData.noiseTolerrance}
                onValueChange={(v) => setPreferencesData({ ...preferencesData, noiseTolerrance: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very_quiet">Must be very quiet</SelectItem>
                  <SelectItem value="average">Average noise is fine</SelectItem>
                  <SelectItem value="not_concerned">Not concerned about noise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="allergies"
                checked={preferencesData.allergies}
                onCheckedChange={(v) => setPreferencesData({ ...preferencesData, allergies: v as boolean })}
              />
              <Label htmlFor="allergies">Household members have allergies/asthma</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="pets"
                checked={preferencesData.pets}
                onCheckedChange={(v) => setPreferencesData({ ...preferencesData, pets: v as boolean })}
              />
              <Label htmlFor="pets">Have pets in the home</Label>
            </div>

            <div>
              <Label>Home Occupancy</Label>
              <Select
                value={preferencesData.homeOccupancy}
                onValueChange={(v) => setPreferencesData({ ...preferencesData, homeOccupancy: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Always occupied (work from home)</SelectItem>
                  <SelectItem value="mostly">Mostly occupied (family)</SelectItem>
                  <SelectItem value="daytime_empty">Empty during work hours</SelectItem>
                  <SelectItem value="variable">Variable schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Are you the decision maker?</Label>
              <Select
                value={preferencesData.decisionMaker}
                onValueChange={(v) => setPreferencesData({ ...preferencesData, decisionMaker: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I can make the decision</SelectItem>
                  <SelectItem value="spouse">Need to consult spouse/partner</SelectItem>
                  <SelectItem value="other">Need to consult others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="competitorQuotes"
                checked={preferencesData.competitorQuotes}
                onCheckedChange={(v) => setPreferencesData({ ...preferencesData, competitorQuotes: v as boolean })}
              />
              <Label htmlFor="competitorQuotes">Have quotes from other companies</Label>
            </div>

            <Button className="w-full bg-pink-500 hover:bg-pink-600" onClick={() => markComplete("preferences")}>
              Save Preferences
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  // Render equipment selection
  const renderEquipmentStep = () => {
    // Add safety checks for context functions
    if (!getTierPrice || !getCustomerPrice) {
      return (
        <div className="p-4 text-center">
          <p>Loading pricing information...</p>
        </div>
      )
    }

    const tonnage = selectedEquipment?.tonnage || calculateTonnage()
    const tiers = getEquipmentTiers(tonnage)
    const recommendedTier = getRecommendedTier()
    const recommendationReason = getRecommendationReason()

    return (
      <div className="bg-card/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border shadow-lg">
        {/* Header with help */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold">Select Your HVAC Equipment</h2>
            <HelpTooltip content="Choose the equipment tier that best fits your needs. Higher SEER ratings mean better energy efficiency and lower operating costs." />
          </div>
          {recommendedTier && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <p className="text-sm text-green-800">
                <strong>Recommendation:</strong> Based on {recommendationReason}, we recommend the <strong>{recommendedTier === "best" ? "Ultimate Comfort" : recommendedTier === "better" ? "Premium Comfort" : "Essential Comfort"}</strong> tier.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers
            .filter((t) => shouldShowTier(t.tier))
            .map((tier) => (
              <button
                key={tier.tier}
                onClick={() => setSelectedEquipment(tier)}
                className={`p-4 md:p-6 rounded-xl border-2 text-left transition-all relative ${
                  selectedEquipment?.tier === tier.tier
                    ? "border-primary bg-primary/5"
                    : tier.recommended
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-border hover:border-primary/50"
                }`}
              >
                {tier.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                    ⭐ Recommended for You
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      tier.tier === "best"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                        : tier.tier === "better"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {tier.tier === "best" ? "BEST VALUE" : tier.tier === "better" ? "POPULAR" : "BUDGET"}
                  </span>
                  {selectedEquipment?.tier === tier.tier && <Check className="w-5 h-5 text-primary" />}
                </div>
                <h3 className="text-lg font-semibold mb-1">{tier.name}</h3>
                <p className="text-2xl font-bold text-primary mb-1">${tier.price.toLocaleString()}</p>
                <div className="mb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Cost: ${tier.baseCost.toLocaleString()}</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      +${(tier.price - tier.baseCost).toLocaleString()} margin (
                      {Math.round(((tier.price - tier.baseCost) / tier.baseCost) * 100)}%)
                    </span>
                  </div>
                </div>
                {/* </CHANGE> */}
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm text-muted-foreground">{tier.seer} SEER Rating</p>
                  <HelpTooltip content={`SEER (Seasonal Energy Efficiency Ratio) measures cooling efficiency. ${tier.seer} SEER means this system is ${tier.seer >= 18 ? 'highly' : tier.seer >= 16 ? 'moderately' : 'basically'} efficient. Higher SEER = lower energy bills.`} />
                </div>

                <ul className="space-y-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {tier.seer >= 16 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Save up to {Math.round(((tier.seer - 14) / 14) * 30)}% on cooling costs
                    </p>
                  </div>
                )}
              </button>
            ))}
        </div>

        {(solarData.interested || solarData.hasSolarInstalled) && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Solar Integration Benefits</h4>
                <p className="text-xs text-muted-foreground">
                  {solarData.hasSolarInstalled
                    ? "Your existing solar system pairs perfectly with high-efficiency HVAC. Higher SEER ratings maximize your solar investment."
                    : "Planning solar? Higher efficiency HVAC systems reduce your overall energy needs, allowing for a smaller solar system and faster payback."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render add-ons step
  const renderAddOnsStep = () => (
    <div className="bg-card/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addOns.map((addOn) => (
          <button
            key={addOn.id}
            onClick={() => toggleAddOn(addOn.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all bg-card/10 backdrop-blur-sm ${
              addOn.selected ? "border-green-500 bg-green-500/10" : "border-border hover:border-green-300"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className={`font-semibold ${addOn.selected ? "text-white" : ""}`}>{addOn.name}</h3>
              {addOn.selected && <Check className="w-5 h-5 text-green-500" />}
            </div>
            <p className={`text-sm mb-2 ${addOn.selected ? "text-gray-200" : "text-muted-foreground"}`}>
              {addOn.description}
            </p>
            <p className={`text-lg font-bold ${addOn.selected ? "text-green-400" : "text-primary"}`}>
              ${getCustomerPrice(addOn.price).toLocaleString()}
            </p>
          </button>
        ))}
      </div>
    </div>
  )

  // Render maintenance step
  const renderMaintenanceStep = () => (
    <div className="bg-card/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const salesPrice = getPlanSalesPrice(plan)
          const customerPrice = getCustomerPrice(salesPrice)
          const monthlyPrice = getPlanMonthlyPrice(plan)
          const customerMonthlyPrice = getCustomerPrice(monthlyPrice)

          const isSelected = selectedPlan?.id === plan.id

          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`p-4 md:p-6 rounded-xl border-2 text-left transition-all bg-card/10 backdrop-blur-sm ${
                isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    plan.tier === "premium"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                  }`}
                >
                  {plan.tier.toUpperCase()}
                </span>
                {isSelected && <Check className="w-5 h-5 text-primary" />}
              </div>

              <h3 className={`text-lg font-semibold mb-1 ${isSelected ? "text-white" : ""}`}>{plan.name}</h3>
              <div className="mb-3">
                <p className={`text-2xl font-bold ${isSelected ? "text-primary" : "text-primary"}`}>
                  ${customerPrice.toLocaleString()}/year
                </p>
                <p className={`text-sm ${isSelected ? "text-gray-200" : "text-muted-foreground"}`}>
                  or ${customerMonthlyPrice.toFixed(2)}/month
                </p>
                <p className={`text-xs mt-1 ${isSelected ? "text-gray-300" : "text-muted-foreground"}`}>
                  {plan.visitsPerYear} visits per year
                </p>
              </div>

              <ul className="space-y-1">
                {plan.features.slice(0, 5).map((feature, i) => (
                  <li key={i} className={`text-sm flex items-start gap-2 ${isSelected ? "text-gray-200" : ""}`}>
                    <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className={`text-sm ${isSelected ? "text-gray-300" : "text-muted-foreground"}`}>
                    +{plan.features.length - 5} more...
                  </li>
                )}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )

  // Render incentives step
  const renderIncentivesStep = () => (
    <div className="bg-white/10 backdrop-blur-sm border-2 border-green-300 rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="space-y-4">
        {incentives
          .filter((i) => i.available)
          .map((incentive) => {
            const isSelected = selectedIncentives.some((s) => s.id === incentive.id)
            return (
              <button
                key={incentive.id}
                onClick={() => toggleIncentive(incentive)}
                className={`w-full p-4 md:p-6 rounded-xl border-2 text-left transition-all ${
                  isSelected ? "border-green-500 bg-green-50" : "border-border hover:border-green-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{incentive.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          incentive.type === "tax_credit"
                            ? "bg-blue-100 text-blue-800"
                            : incentive.type === "rebate"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {incentive.type === "tax_credit"
                          ? "Tax Credit"
                          : incentive.type === "rebate"
                            ? "Rebate"
                            : "Discount"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{incentive.description}</p>
                    <div className="space-y-1">
                      {incentive.requirements.map((req, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          {req}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-green-600">-${incentive.amount.toLocaleString()}</p>
                    {isSelected && <Check className="w-5 h-5 text-green-500 ml-auto mt-1" />}
                  </div>
                </div>
              </button>
            )
          })}
      </div>

      {incentives.filter((i) => i.available).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No incentives currently available</div>
      )}
    </div>
  )

  // Render payment step
  const renderPaymentStep = () => {
    if (!selectedEquipment) return null

    const equipmentCustomerPrice = selectedEquipment.price
    const addOnsCustomerPrice = addOns.filter((a) => a.selected).reduce((sum, a) => sum + getCustomerPrice(a.price), 0)
    const maintenanceCustomerPrice = selectedPlan ? getCustomerPrice(getPlanSalesPrice(selectedPlan)) : 0
    const incentivesTotal = selectedIncentives.reduce((sum, i) => sum + i.amount, 0)
    const totalCustomerPrice = equipmentCustomerPrice + addOnsCustomerPrice + maintenanceCustomerPrice - incentivesTotal

    return (
      <div className="bg-card/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border shadow-lg">
        {/* Payment Method Selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <Button
            variant={paymentMethod === "cash" ? "default" : "outline"}
            onClick={() => setPaymentMethod("cash")}
            className="w-full"
          >
            Cash
          </Button>
          <Button
            variant={paymentMethod === "financing" ? "default" : "outline"}
            onClick={() => setPaymentMethod("financing")}
            className="w-full"
          >
            Financing
          </Button>
          <Button
            variant={paymentMethod === "leasing" ? "default" : "outline"}
            onClick={() => setPaymentMethod("leasing")}
            className="w-full"
          >
            Leasing
          </Button>
        </div>

        {/* Cash Options */}
        {paymentMethod === "cash" && (
          <div className="space-y-4">
            <div className="p-6 border-2 border-primary rounded-xl bg-primary/5">
              <h3 className="text-xl font-bold mb-2">Pay in Full</h3>
              <p className="text-3xl font-bold text-primary mb-2">${totalCustomerPrice.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">One-time payment - own your system outright</p>
            </div>
          </div>
        )}

        {/* Financing Options */}
        {paymentMethod === "financing" && financingOptions && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-3">
              Select a financing term below. Monthly payments are based on system price of $
              {totalCustomerPrice.toLocaleString()}
            </p>
            {financingOptions
              .filter((opt) => opt.type === "finance" && opt.available)
              .map((option) => {
                const monthlyPayment = calculateMonthlyPayment(totalCustomerPrice, option)
                const isSelected = selectedFinancingOption?.id === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFinancingOption(option)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${isSelected ? "text-white" : ""}`}>{option.name}</h3>
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-2xl font-bold ${isSelected ? "text-primary" : "text-primary"}`}>
                        ${monthlyPayment.toFixed(2)}
                      </span>
                      <span className={`text-sm ${isSelected ? "text-gray-200" : "text-muted-foreground"}`}>
                        /month
                      </span>
                    </div>
                    <p className={`text-sm ${isSelected ? "text-gray-200" : "text-muted-foreground"}`}>
                      {option.description}
                    </p>
                    {option.apr > 0 && (
                      <p className={`text-xs mt-1 ${isSelected ? "text-gray-300" : "text-muted-foreground"}`}>
                        {option.apr}% APR
                      </p>
                    )}
                  </button>
                )
              })}
          </div>
        )}

        {/* Leasing Options */}
        {paymentMethod === "leasing" && financingOptions && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground mb-3">
              Select a lease term below. Monthly payments are based on system price of $
              {totalCustomerPrice.toLocaleString()}
            </p>
            
            {/* Finance Application Section - Show if Comfort Plan selected and proposal saved */}
            {proposalId && selectedFinancingOption?.provider === "Lightreach" && (
              <div className="mt-6 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                <h3 className="text-lg font-semibold mb-3">Comfort Plan Finance Application</h3>
                {selectedFinanceApplicationId ? (
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFinanceApplicationId(null)}
                    >
                      ← Back to Applications
                    </Button>
                    <FinanceApplicationStatus applicationId={selectedFinanceApplicationId} autoRefresh />
                  </div>
                ) : (
                  <FinanceApplicationList
                    proposalId={proposalId}
                    onNewApplication={() => setShowFinanceForm(true)}
                  />
                )}
              </div>
            )}
            {Object.entries(
              financingOptions
                .filter(
                  (opt) => opt.type === "lease" && opt.available && (opt.termMonths === 120 || opt.termMonths === 144),
                )
                .reduce(
                  (acc, option) => {
                    const term = option.termMonths
                    if (!acc[term]) {
                      acc[term] = []
                    }
                    acc[term].push(option)
                    return acc
                  },
                  {} as Record<number, typeof financingOptions>,
                ),
            )
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([termMonths, options]) => {
                return (
                  <div key={termMonths}>
                    <h4 className="font-semibold mb-3">
                      {Math.floor(Number(termMonths) / 12)} Year
                      {Math.floor(Number(termMonths) / 12) !== 1 ? "s" : ""}
                    </h4>
                    <div className="space-y-2">
                      {options.map((option) => {
                        const monthlyPayment = calculateMonthlyPayment(totalCustomerPrice, option)
                        const escalator = option.name.includes("1.99%")
                          ? "1.99%"
                          : option.name.includes("0.99%")
                            ? "0.99%"
                            : "0%"
                        const isSelected = selectedFinancingOption?.id === option.id
                        return (
                          <button
                            key={option.id}
                            onClick={() => setSelectedFinancingOption(option)}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                              isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className={`font-semibold ${isSelected ? "text-white" : ""}`}>
                                  {option.provider} Lease
                                </h3>
                                <span className={`text-xs ${isSelected ? "text-gray-300" : "text-muted-foreground"}`}>
                                  {escalator} Escalator
                                </span>
                              </div>
                              {isSelected && <Check className="w-5 h-5 text-primary" />}
                            </div>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className={`text-2xl font-bold ${isSelected ? "text-primary" : "text-primary"}`}>
                                ${monthlyPayment.toFixed(2)}
                              </span>
                              <span className={`text-sm ${isSelected ? "text-gray-200" : "text-muted-foreground"}`}>
                                /month
                              </span>
                            </div>
                            {escalator !== "0%" && (
                              <p className={`text-xs ${isSelected ? "text-gray-300" : "text-muted-foreground"}`}>
                                Year 1, increases {escalator} annually
                              </p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    )
  }

  // Render proposal step
  const renderProposalStep = () => {
    const selectedFinancing =
      paymentMethod === "financing"
        ? selectedFinancingOption
        : paymentMethod === "leasing"
          ? selectedFinancingOption
          : null

    let monthlyPayment = 0
    if (selectedFinancing) {
      const equipmentCustomerPrice = selectedEquipment?.price || 0
      const addOnsCustomerPrice = addOns
        .filter((a) => a.selected)
        .reduce((sum, a) => sum + getCustomerPrice(a.price), 0)
      const maintenanceCustomerPrice = selectedPlan ? getCustomerPrice(getPlanSalesPrice(selectedPlan)) : 0
      const totalCustomerPrice = equipmentCustomerPrice + addOnsCustomerPrice + maintenanceCustomerPrice
      monthlyPayment = calculateMonthlyPayment(totalCustomerPrice, selectedFinancing)
    }

    const getBrandName = (tier: string) => {
      switch (tier) {
        case "best":
          return "Daikin"
        case "better":
          return "Goodman"
        case "good":
          return "Goodman"
        default:
          return "Quality"
      }
    }

    const getEquipmentDescription = (tier: string, seer: number) => {
      switch (tier) {
        case "best":
          return `Premium ${seer}-SEER high-efficiency system with advanced comfort features, quiet operation, and superior energy savings. Includes multi-stage cooling, enhanced humidity control, and smart thermostat compatibility.`
        case "better":
          return `High-performance ${seer}-SEER system offering excellent efficiency and reliability. Features include two-stage cooling for improved comfort, quiet operation, and significant energy savings over standard models.`
        case "good":
          return `Dependable ${seer}-SEER system providing reliable comfort and improved efficiency. Single-stage cooling with quality construction and excellent warranty coverage for peace of mind.`
        default:
          return `High-efficiency HVAC system designed for comfort and energy savings.`
      }
    }

    const getAddonDescription = (addonName: string) => {
      const descriptions: Record<string, string> = {
        "Smart Thermostat":
          "WiFi-enabled programmable thermostat with smartphone app control, energy usage tracking, and automated scheduling for maximum comfort and efficiency.",
        "UV Air Purifier":
          "Advanced ultraviolet air purification system that kills bacteria, viruses, and mold spores in your ductwork, providing cleaner, healthier indoor air for your family.",
        "Surge Protector":
          "Industrial-grade surge protection device that safeguards your HVAC investment from power surges, lightning strikes, and electrical damage, extending equipment lifespan.",
        "Duct Sealing":
          "Professional aeroseal duct sealing service that repairs leaks and improves system efficiency by up to 30%, reducing energy waste and improving comfort in every room.",
        "Extended Warranty":
          "Comprehensive extended warranty coverage providing 5 additional years of parts and labor protection beyond the manufacturer's warranty for complete peace of mind.",
        "Zoning System":
          "Multi-zone climate control system allowing independent temperature management for different areas of your home, maximizing comfort and efficiency while reducing energy costs.",
      }
      return descriptions[addonName] || "Premium add-on enhancing your HVAC system performance and comfort."
    }

    return (
      <div
        className="bg-card/10 backdrop-blur-sm rounded-lg p-6 md:p-10 shadow-2xl max-w-5xl mx-auto space-y-8"
        id="proposal-content"
        style={{
          backgroundImage: "url(/proposal-background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Header with Edit button */}
        <div className="text-center border-b border-white/20 pb-6 relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white">Your Custom HVAC Solution</h2>
          <p className="text-gray-300 text-lg">KIN HOME</p>
          <div className="absolute top-0 right-0 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPricingStep("equipment")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Proposal
            </Button>
          </div>
        </div>

        {/* Equipment Details with Edit */}
        <div className="bg-card/10 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-6 md:p-8 shadow-lg relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPricingStep("equipment")}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Wind className="w-8 h-8 text-primary" />
                <h3 className="text-2xl font-bold text-white">Complete HVAC System</h3>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-primary/10 rounded-full text-sm font-semibold">
                  {getBrandName(selectedEquipment?.tier || "good")}
                </span>
                <span className="px-3 py-1 bg-secondary/50 rounded-full text-sm font-semibold">
                  {selectedEquipment?.seer} SEER
                </span>
                <span className="px-3 py-1 bg-secondary/50 rounded-full text-sm font-semibold">
                  {calculateTonnage()} Ton
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">${(selectedEquipment?.price || 0).toLocaleString()}</p>
            </div>
          </div>

          <p className="text-gray-300 mb-4 leading-relaxed">
            {getEquipmentDescription(selectedEquipment?.tier || "good", selectedEquipment?.seer || 16)}
          </p>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              System Includes:
            </h4>
            <ul className="grid md:grid-cols-2 gap-2">
              {selectedEquipment?.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Add-ons */}
        {addOns.some((a) => a.selected) && (
          <div className="bg-card/10 backdrop-blur-sm border-2 border-blue-200 rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-7 h-7 text-blue-600" />
              <h3 className="text-2xl font-bold text-white">Premium Add-Ons</h3>
            </div>
            <div className="space-y-6">
              {addOns
                .filter((a) => a.selected)
                .map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-start gap-4 pb-6 border-b border-white/10 last:border-b-0 last:pb-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg text-white">{addon.name}</h4>
                        <span className="text-xl font-bold text-blue-600">${addon.price}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{getAddonDescription(addon.name)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Maintenance Plan - Show service details instead of cost */}
        {selectedPlan && (
          <div className="bg-card/10 backdrop-blur-sm border-2 border-purple-200 rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-7 h-7 text-purple-600" />
              <h3 className="text-2xl font-bold text-white">Maintenance & Care Plan</h3>
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h4 className="text-xl font-semibold mb-1 text-white">{selectedPlan.name}</h4>
                <p className="text-muted-foreground text-gray-300">{selectedPlan.description}</p>
              </div>
              <div className="text-right">
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-lg font-bold inline-block">
                  {selectedPlan.visitsPerYear} {selectedPlan.visitsPerYear === 1 ? "Visit" : "Visits"}/Year
                </span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-5">
              <h5 className="font-semibold mb-4 flex items-center gap-2 text-white">
                <Wrench className="w-5 h-5 text-purple-600" />
                Service Includes:
              </h5>
              <ul className="grid md:grid-cols-2 gap-3">
                {selectedPlan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-900 font-medium">
                💡 Regular maintenance extends equipment life by up to 40% and maintains peak efficiency, saving you
                money on energy bills.
              </p>
            </div>
          </div>
        )}

        {/* Incentives */}
        {selectedIncentives.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm border-2 border-green-300 rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-7 h-7 text-green-700" />
              <h3 className="text-2xl font-bold text-green-900">Your Savings & Incentives</h3>
            </div>
            <div className="space-y-3">
              {selectedIncentives.map((incentive) => (
                <div key={incentive.id} className="flex justify-between items-center bg-white/70 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-700" />
                    </div>
                    <span className="font-medium text-lg text-white">{incentive.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-green-700">-${incentive.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Investment */}
        <div className="bg-gradient-to-br from-slate-900/20 to-slate-800/20 backdrop-blur-sm text-white rounded-2xl p-6 md:p-10 shadow-2xl border-2 border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-slate-400 text-lg mb-2">Total Investment</p>
              <p className="text-5xl md:text-6xl font-bold">${getTotal().toLocaleString()}</p>
            </div>

            {selectedFinancing && (
              <div className="text-center md:text-right border-l-0 md:border-l-2 border-t-2 md:border-t-0 border-slate-600 pt-6 md:pt-0 md:pl-10">
                <p className="text-slate-400 mb-2">Or as low as</p>
                <p className="text-4xl md:text-5xl font-bold text-green-400">
                  ${monthlyPayment.toFixed(2)}
                  <span className="text-2xl">/month</span>
                </p>
                {selectedFinancing.name && <p className="text-sm text-slate-400 mt-2">{selectedFinancing.name}</p>}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700 text-center">
            <p className="text-slate-300 text-sm">
              Professional installation by certified technicians • Full warranty coverage • Satisfaction guaranteed
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main render
  if (showPricing) {
    return (
      <div
        className="min-h-screen flex flex-col bg-background"
        style={{
          backgroundImage: "url(/pricing-background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Progress bar with clickable steps */}
        <div className="p-3 border-b bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-xs">
            {pricingSteps.map((step, i) => {
              const currentIndex = pricingSteps.indexOf(pricingStep)
              const isActive = step === pricingStep
              const isCompleted = i < currentIndex
              const canClick = isCompleted || i === currentIndex || i === currentIndex + 1

              return (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => canClick && goToStep(step)}
                    disabled={!canClick}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground scale-110"
                        : isCompleted
                          ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                          : canClick
                            ? "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                    }`}
                    title={stepLabels[step]}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      i + 1
                    )}
                  </button>
                  {i < pricingSteps.length - 1 && (
                    <div className={`w-4 md:w-8 h-0.5 transition-colors ${
                      isCompleted ? "bg-green-500" : "bg-muted"
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
          {/* Auto-save indicator */}
          {proposalId && (
            <div className="flex justify-center mt-2">
              <AutoSaveIndicator
                isSaving={isAutoSaving}
                lastSaved={lastSaved}
                error={saveError}
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Step Navigation */}
          <StepNavigation
            currentStep={pricingStep}
            steps={pricingSteps}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            canProceed={canProceedToNextStep()}
            estimatedTime={estimatedTimes[pricingStep]}
          />

          {/* Validation Errors */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">Please fix the following:</span>
              </div>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {Object.values(validationErrors).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {pricingStep === "equipment" && (
            <div className="bg-card/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border shadow-lg">
              {renderEquipmentStep()}
            </div>
          )}
          {pricingStep === "addons" && renderAddOnsStep()}
          {pricingStep === "maintenance" && renderMaintenanceStep()}
          {pricingStep === "incentives" && (
            <div className="bg-white/10 backdrop-blur-sm border-2 border-green-300 rounded-2xl p-6 md:p-8 shadow-lg">
              {renderIncentivesStep()}
            </div>
          )}
          {pricingStep === "payment" && (
            <div className="bg-card/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border shadow-lg">
              {renderPaymentStep()}
            </div>
          )}
          {pricingStep === "review" && (
            <div className="flex flex-col gap-3 pb-4">
              {renderProposalStep()}
              {showProposalActions && (
                <div className="flex-1 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const element = document.getElementById("proposal-content")
                      if (!element) return

                      try {
                        // Import libraries dynamically
                        const html2canvas = (await import("html2canvas")).default
                        const jsPDF = (await import("jspdf")).default

                        // Clone the element to avoid modifying the original
                        const clone = element.cloneNode(true) as HTMLElement
                        clone.style.position = "absolute"
                        clone.style.left = "-9999px"
                        clone.style.top = "0"
                        document.body.appendChild(clone)

                        // Function to convert oklch to rgba
                        const convertOklchToRgba = (element: HTMLElement) => {
                          const computedStyle = window.getComputedStyle(element)

                          // Convert color properties
                          const colorProps = [
                            "color",
                            "backgroundColor",
                            "borderColor",
                            "borderTopColor",
                            "borderRightColor",
                            "borderBottomColor",
                            "borderLeftColor",
                            "outlineColor",
                            "fill",
                            "stroke",
                          ]

                          colorProps.forEach((prop) => {
                            const value = computedStyle.getPropertyValue(prop)
                            if (value && value.includes("oklch")) {
                              // Get the computed RGB value
                              const tempDiv = document.createElement("div")
                              tempDiv.style.color = value
                              document.body.appendChild(tempDiv)
                              const computed = window.getComputedStyle(tempDiv).color
                              document.body.removeChild(tempDiv)

                              // Apply the computed value
                              ;(element.style as any)[prop] = computed
                            }
                          })

                          // Recursively process children
                          Array.from(element.children).forEach((child) => {
                            convertOklchToRgba(child as HTMLElement)
                          })
                        }

                        // Convert all oklch colors in the clone
                        convertOklchToRgba(clone)

                        // Wait a brief moment for styles to apply
                        await new Promise((resolve) => setTimeout(resolve, 100))

                        // Capture the cloned element as canvas
                        const canvas = await html2canvas(clone, {
                          scale: 2,
                          useCORS: true,
                          logging: false,
                          backgroundColor: "#1a1a1a",
                          foreignObjectRendering: false,
                          allowTaint: true,
                        })

                        // Remove the clone
                        document.body.removeChild(clone)

                        // Convert to PDF
                        const imgData = canvas.toDataURL("image/png")
                        const pdf = new jsPDF({
                          orientation: "portrait",
                          unit: "mm",
                          format: "a4",
                        })

                        const imgWidth = 210 // A4 width in mm
                        const imgHeight = (canvas.height * imgWidth) / canvas.width

                        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
                        pdf.save("hvac-proposal.pdf")
                      } catch (error) {
                        console.error("Error generating PDF:", error)
                        alert("Failed to generate PDF. Please try again.")
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button className="flex-1 bg-pink-500 hover:bg-pink-600" onClick={handleSendToKin}>
                    <Send className="w-4 h-4 mr-2" />
                    Send to Kin
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions - Only show on review step */}
        {pricingStep === "review" && showProposalActions && (
          <div className="p-3 md:p-4 bg-card/15 sticky bottom-0 backdrop-blur-sm border-t">
            <div className="flex flex-col sm:flex-row gap-3 max-w-5xl mx-auto">
              <Button
                variant="outline"
                onClick={async () => {
                  const element = document.getElementById("proposal-content")
                  if (!element) return

                  try {
                    const html2canvas = (await import("html2canvas")).default
                    const jsPDF = (await import("jspdf")).default

                    const clone = element.cloneNode(true) as HTMLElement
                    clone.style.position = "absolute"
                    clone.style.left = "-9999px"
                    clone.style.top = "0"
                    document.body.appendChild(clone)

                    const convertOklchToRgba = (element: HTMLElement) => {
                      const computedStyle = window.getComputedStyle(element)
                      const colorProps = [
                        "color", "backgroundColor", "borderColor",
                        "borderTopColor", "borderRightColor", "borderBottomColor",
                        "borderLeftColor", "outlineColor", "fill", "stroke",
                      ]

                      colorProps.forEach((prop) => {
                        const value = computedStyle.getPropertyValue(prop)
                        if (value && value.includes("oklch")) {
                          const tempDiv = document.createElement("div")
                          tempDiv.style.color = value
                          document.body.appendChild(tempDiv)
                          const computed = window.getComputedStyle(tempDiv).color
                          document.body.removeChild(tempDiv)
                          clone.style.setProperty(prop, computed, "important")
                        }
                      })

                      Array.from(clone.children).forEach((child) => {
                        convertOklchToRgba(child as HTMLElement)
                      })
                    }

                    convertOklchToRgba(clone)
                    await new Promise((resolve) => setTimeout(resolve, 500))

                    const canvas = await html2canvas(clone, {
                      scale: 2,
                      useCORS: true,
                      logging: false,
                    })

                    document.body.removeChild(clone)

                    const imgData = canvas.toDataURL("image/png")
                    const pdf = new jsPDF({
                      orientation: "portrait",
                      unit: "mm",
                      format: "a4",
                    })

                    const imgWidth = 210
                    const pageHeight = 297
                    const imgHeight = (canvas.height * imgWidth) / canvas.width
                    let heightLeft = imgHeight
                    let position = 0

                    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
                    heightLeft -= pageHeight

                    while (heightLeft >= 0) {
                      position = heightLeft - imgHeight
                      pdf.addPage()
                      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
                      heightLeft -= pageHeight
                    }

                    pdf.save(`proposal-${customerData.name || "customer"}-${new Date().toISOString().split("T")[0]}.pdf`)
                    toast.success("PDF downloaded successfully!")
                  } catch (error) {
                    console.error("Error generating PDF:", error)
                    toast.error("Failed to generate PDF. Please try again.")
                  }
                }}
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                className="flex-1 bg-pink-500 hover:bg-pink-600" 
                onClick={handleSendToKin}
                disabled={isAutoSaving}
              >
                <Send className="w-4 h-4 mr-2" />
                {isAutoSaving ? "Saving..." : "Send to Customer"}
              </Button>
            </div>
            <div className="flex gap-3 mt-3 justify-center">
              <Button variant="ghost" size="sm" onClick={handleStartOver}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              <Button variant="ghost" size="sm" onClick={handleAdminClick}>
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Determine if all hotspots are completed
  const allHotspotsCompleted = completedSections.size === hotspots.length

  // Get missing sections for completion card
  const getMissingSections = (): string[] => {
    const missing: string[] = []
    const sectionLabels: Record<string, string> = {
      customer: "Customer Information",
      home: "Home Details",
      hvac: "HVAC System",
      solar: "Solar Interest",
      electrical: "Electrical Panel",
      preferences: "Customer Preferences"
    }
    
    hotspots.forEach(hotspot => {
      if (!completedSections.has(hotspot.id)) {
        missing.push(sectionLabels[hotspot.id] || hotspot.label)
      }
    })
    
    return missing
  }

  // Handle hotspot click
  const handleHotspotClick = (hotspotId: string) => {
    setActiveModal(hotspotId as HotspotType)
  }

  // House view with hotspots
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* House image with hotspots */}
      <div className="flex-1 relative overflow-hidden max-h-[calc(100vh-80px)] md:max-h-none">
        <img
          src="/house-assessment.png"
          alt="House"
          className="w-full h-full object-contain md:object-cover hidden portrait:hidden md:block"
        />
        <img
          src="/modern-home-portrait.png"
          alt="House"
          className="w-full h-full object-cover block portrait:block md:hidden"
        />

        {/* Hotspots */}
        {hotspots.map((hotspot) => (
          <div
            key={hotspot.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ top: hotspot.top, left: hotspot.left }}
          >
            <button
              onClick={() => handleHotspotClick(hotspot.id)}
              className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                completedSections.has(hotspot.id)
                  ? "bg-green-500 scale-100"
                  : "bg-primary hover:scale-110 animate-pulse"
              }`}
              aria-label={hotspot.label}
            >
              {completedSections.has(hotspot.id) ? (
                <Check className="w-4 h-4 md:w-6 md:h-6 text-white" />
              ) : (
                hotspot.icon
              )}
            </button>
          </div>
        ))}

        <button
          onClick={handleAdminClick}
          className="absolute opacity-0 hover:opacity-10 hover:bg-white transition-opacity cursor-default"
          style={{ bottom: "8%", right: "5%", width: "17.5%", height: "24.5%", minHeight: "80px" }}
          aria-label="Admin access"
        />

        {/* Progress indicator */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
          {completedSections.size}/{hotspots.length} complete
        </div>
      </div>

      {/* Assessment Completion Card */}
      {completedSections.size > 0 && (
        <AssessmentCompletionCard
          completedSections={completedSections}
          totalSections={hotspots.length}
          onContinue={() => {
            if (allHotspotsCompleted) {
              setShowPricing(true)
              setShowProposalActions(true)
            }
          }}
          missingSections={getMissingSections()}
        />
      )}

      {/* Bottom bar with Go to Pricing button - Mobile optimized */}
      <div className="p-3 md:p-4 bg-card/95 sticky bottom-0 backdrop-blur-sm border-t">
        <Button
          className={`w-full transition-all ${!allHotspotsCompleted ? "opacity-50 cursor-not-allowed" : ""}`}
          size="lg"
          disabled={!allHotspotsCompleted}
          onClick={() => {
            if (allHotspotsCompleted) {
              setShowPricing(true)
              setShowProposalActions(true)
            }
          }}
        >
          {allHotspotsCompleted && <Check className="w-4 h-4 mr-2 text-green-500" />}
          {allHotspotsCompleted ? "Go to Pricing" : `Complete ${hotspots.length - completedSections.size} more section${hotspots.length - completedSections.size !== 1 ? 's' : ''}`}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Hotspot modals - Mobile optimized */}
      <Dialog open={activeModal !== null} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{activeModal && getModalTitle(activeModal)}</DialogTitle>
            <DialogDescription>
              {activeModal && `Enter ${activeModal === "customer" ? "customer" : activeModal === "home" ? "home" : activeModal === "hvac" ? "HVAC system" : activeModal === "solar" ? "solar" : activeModal === "electrical" ? "electrical" : "preference"} information for this proposal.`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
            {renderModalContent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile-friendly section list (shown on small screens) */}
      <div className="md:hidden p-4 bg-card/95 backdrop-blur-sm border-t">
        <div className="space-y-2">
          {hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              onClick={() => handleHotspotClick(hotspot.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                completedSections.has(hotspot.id)
                  ? "border-green-500 bg-green-50"
                  : "border-border hover:border-primary"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                completedSections.has(hotspot.id) ? "bg-green-500" : "bg-primary"
              }`}>
                {completedSections.has(hotspot.id) ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  hotspot.icon
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{hotspot.label}</div>
                {completedSections.has(hotspot.id) && (
                  <div className="text-xs text-green-600">Completed</div>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Finance Application Form Dialog */}
      {proposalId && selectedFinancingOption?.provider === "Lightreach" && (
        <Dialog open={showFinanceForm} onOpenChange={setShowFinanceForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Comfort Plan Finance Application</DialogTitle>
              <DialogDescription>
                Complete the finance application form to submit a Comfort Plan application for this proposal.
              </DialogDescription>
            </DialogHeader>
            <FinanceApplicationForm
              proposalId={proposalId}
              systemPrice={(() => {
                const equipmentPrice = selectedEquipment?.price || 0
                const addOnsPrice = addOns.filter((a) => a.selected).reduce((sum, a) => sum + getCustomerPrice(a.price), 0)
                const maintenancePrice = selectedPlan ? getCustomerPrice(getPlanSalesPrice(selectedPlan)) : 0
                const incentivesTotal = selectedIncentives.reduce((sum, i) => sum + i.amount, 0)
                return equipmentPrice + addOnsPrice + maintenancePrice - incentivesTotal
              })()}
              initialData={{
                firstName: customerData.name?.split(' ')[0] || '',
                lastName: customerData.name?.split(' ').slice(1).join(' ') || '',
                email: customerData.email || '',
                phone: customerData.phone || '',
                address: customerData.address || '',
                city: customerData.city || '',
                state: customerData.state || '',
                zip: customerData.zip || '',
              }}
              onSuccess={(applicationId) => {
                setShowFinanceForm(false)
                setSelectedFinanceApplicationId(applicationId)
              }}
              onCancel={() => setShowFinanceForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
