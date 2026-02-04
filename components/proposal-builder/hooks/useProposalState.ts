"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface PropertyData {
  squareFootage: number;
  yearBuilt: number;
  stories: number;
  bedrooms: number;
  bathrooms: number;
  hasAdditionsOrRemodeling: boolean;
  additionsHaveDuctwork: boolean;
}

export interface CurrentSystemData {
  currentSystem: string;
  systemAge: string;
  hasDuctwork: boolean;
  equipmentType: "auto" | "central" | "mini-split" | "package" | "package-rooftop" | "package-ground";
  issues: string[];
  lastServiced: string;
  heatingType: string;
  thermostatType: string;
  zonesCount: number;
  humidity: boolean;
  airQuality: string;
  noiseLevel: string;
  ductworkCondition: string;
  ductworkAge: number;
  climateZone: string;
  // AI analysis fields
  nameplatePhoto?: string;
  nameplatePhotoUrl?: string;
  nameplatePhotoPath?: string;
  coolingType?: string;
  tonnage?: string;
  brand?: string;
  modelNumber?: string;
  seerRating?: string;
  refrigerantType?: string;
  aiAnalysisComplete?: boolean;
}

export interface NeedsAssessment {
  priority: "comfort" | "efficiency" | "budget";
  financing: boolean;
  timeline: string;
  budgetRange: string;
  brandPreference: string;
  warrantyImportance: string;
  environmentalConcern: boolean;
  smartHomeIntegration: boolean;
  noiseTolerance: string;
  allergies: boolean;
  pets: boolean;
  homeOccupancy: string;
  decisionMaker: string;
  competitorQuotes: boolean;
}

export interface Equipment {
  id: string;
  tier: "good" | "better" | "best";
  name: string;
  description: string;
  salesPrice: number;
  customerPrice: number;
  baseCost: number;
  seer: number;
  features: string[];
  tonnage?: number;
  recommended?: boolean;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  customerPrice: number;
  category: "air-quality" | "smart-home" | "protection" | "efficiency";
  selected: boolean;
}

export interface MaintenancePlan {
  id: string;
  name: string;
  tier: "basic" | "standard" | "premium";
  description: string;
  price: number;
  visitsPerYear: number;
  features: string[];
}

export interface Incentive {
  id: string;
  name: string;
  amount: number;
  type: "rebate" | "tax_credit" | "discount";
  description: string;
  requirements: string[];
  selected: boolean;
}

export interface FinancingOption {
  id: string;
  name: string;
  type: "cash" | "finance" | "lease";
  provider?: string;
  termMonths: number;
  apr?: number;
  description?: string;
  escalatorRate?: number;
  monthlyPayment?: number;
}

export type PaymentMethod = "cash" | "financing" | "leasing";

export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected";

export type BuilderSection =
  | "customer"
  | "property"
  | "current-system"
  | "needs"
  | "equipment"
  | "add-ons"
  | "maintenance"
  | "incentives"
  | "financing"
  | "review";

export type PresentationSlide =
  | "welcome"
  | "current-situation"
  | "recommended-system"
  | "enhancements"
  | "protection-plan"
  | "investment"
  | "payment-options"
  | "next-steps";

export interface PricingSummary {
  equipmentPrice: number;
  addOnsTotal: number;
  maintenanceTotal: number;
  subtotal: number;
  incentivesTotal: number;
  taxAmount: number;
  grandTotal: number;
  monthlyPayment: number | null;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultCustomer: CustomerData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
};

const defaultProperty: PropertyData = {
  squareFootage: 0,
  yearBuilt: 2000,
  stories: 1,
  bedrooms: 3,
  bathrooms: 2,
  hasAdditionsOrRemodeling: false,
  additionsHaveDuctwork: false,
};

const defaultCurrentSystem: CurrentSystemData = {
  currentSystem: "",
  systemAge: "",
  hasDuctwork: true,
  equipmentType: "central",
  issues: [],
  lastServiced: "",
  heatingType: "",
  thermostatType: "",
  zonesCount: 1,
  humidity: false,
  airQuality: "",
  noiseLevel: "",
  ductworkCondition: "",
  ductworkAge: 0,
  climateZone: "",
  aiAnalysisComplete: false,
};

const defaultNeeds: NeedsAssessment = {
  priority: "comfort",
  financing: false,
  timeline: "",
  budgetRange: "",
  brandPreference: "",
  warrantyImportance: "",
  environmentalConcern: false,
  smartHomeIntegration: false,
  noiseTolerance: "",
  allergies: false,
  pets: false,
  homeOccupancy: "",
  decisionMaker: "",
  competitorQuotes: false,
};

// ============================================================================
// Zustand Store
// ============================================================================

interface ProposalState {
  // Proposal Data
  customer: CustomerData;
  property: PropertyData;
  currentSystem: CurrentSystemData;
  needs: NeedsAssessment;
  selectedEquipment: Equipment | null;
  addOns: AddOn[];
  maintenancePlan: MaintenancePlan | null;
  maintenanceYears: number;
  incentives: Incentive[];
  paymentMethod: PaymentMethod;
  financingOption: FinancingOption | null;

  // Meta
  proposalId: string | null;
  status: ProposalStatus;
  lastSaved: Date | null;
  isDirty: boolean;
  isLoading: boolean;

  // UI State
  activeSection: BuilderSection;
  mode: "builder" | "presentation";
  presentationSlide: PresentationSlide;
  sectionProgress: Record<BuilderSection, boolean>;

  // Actions - Data Updates
  setCustomer: (data: Partial<CustomerData>) => void;
  setProperty: (data: Partial<PropertyData>) => void;
  setCurrentSystem: (data: Partial<CurrentSystemData>) => void;
  setNeeds: (data: Partial<NeedsAssessment>) => void;
  setSelectedEquipment: (equipment: Equipment | null) => void;
  setAddOns: (addOns: AddOn[]) => void;
  toggleAddOn: (addOnId: string) => void;
  setMaintenancePlan: (plan: MaintenancePlan | null) => void;
  setMaintenanceYears: (years: number) => void;
  setIncentives: (incentives: Incentive[]) => void;
  toggleIncentive: (incentiveId: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setFinancingOption: (option: FinancingOption | null) => void;

  // Actions - Meta
  setProposalId: (id: string | null) => void;
  setStatus: (status: ProposalStatus) => void;
  markSaved: () => void;
  setLoading: (loading: boolean) => void;

  // Actions - UI
  setActiveSection: (section: BuilderSection) => void;
  nextSection: () => void;
  prevSection: () => void;
  setMode: (mode: "builder" | "presentation") => void;
  toggleMode: () => void;
  setPresentationSlide: (slide: PresentationSlide) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  markSectionComplete: (section: BuilderSection) => void;

  // Actions - Calculations
  calculatePricing: () => PricingSummary;
  getCompletionPercentage: () => number;

  // Actions - Persistence
  resetProposal: () => void;
  loadProposal: (data: Partial<ProposalState>) => void;
}

const SECTION_ORDER: BuilderSection[] = [
  "customer",
  "property",
  "current-system",
  "needs",
  "equipment",
  "add-ons",
  "maintenance",
  "incentives",
  "financing",
  "review",
];

const SLIDE_ORDER: PresentationSlide[] = [
  "welcome",
  "current-situation",
  "recommended-system",
  "enhancements",
  "protection-plan",
  "investment",
  "payment-options",
  "next-steps",
];

export const useProposalState = create<ProposalState>()(
  persist(
    (set, get) => ({
      // Initial State
      customer: defaultCustomer,
      property: defaultProperty,
      currentSystem: defaultCurrentSystem,
      needs: defaultNeeds,
      selectedEquipment: null,
      addOns: [],
      maintenancePlan: null,
      maintenanceYears: 1,
      incentives: [],
      paymentMethod: "cash",
      financingOption: null,

      proposalId: null,
      status: "draft",
      lastSaved: null,
      isDirty: false,
      isLoading: false,

      activeSection: "customer",
      mode: "builder",
      presentationSlide: "welcome",
      sectionProgress: {
        customer: false,
        property: false,
        "current-system": false,
        needs: false,
        equipment: false,
        "add-ons": false,
        maintenance: false,
        incentives: false,
        financing: false,
        review: false,
      },

      // Data Update Actions
      setCustomer: (data) =>
        set((state) => ({
          customer: { ...state.customer, ...data },
          isDirty: true,
        })),

      setProperty: (data) =>
        set((state) => ({
          property: { ...state.property, ...data },
          isDirty: true,
        })),

      setCurrentSystem: (data) =>
        set((state) => ({
          currentSystem: { ...state.currentSystem, ...data },
          isDirty: true,
        })),

      setNeeds: (data) =>
        set((state) => ({
          needs: { ...state.needs, ...data },
          isDirty: true,
        })),

      setSelectedEquipment: (equipment) =>
        set({ selectedEquipment: equipment, isDirty: true }),

      setAddOns: (addOns) => set({ addOns, isDirty: true }),

      toggleAddOn: (addOnId) =>
        set((state) => ({
          addOns: state.addOns.map((a) =>
            a.id === addOnId ? { ...a, selected: !a.selected } : a
          ),
          isDirty: true,
        })),

      setMaintenancePlan: (plan) =>
        set({ maintenancePlan: plan, isDirty: true }),

      setMaintenanceYears: (years) =>
        set({ maintenanceYears: years, isDirty: true }),

      setIncentives: (incentives) => set({ incentives, isDirty: true }),

      toggleIncentive: (incentiveId) =>
        set((state) => ({
          incentives: state.incentives.map((i) =>
            i.id === incentiveId ? { ...i, selected: !i.selected } : i
          ),
          isDirty: true,
        })),

      setPaymentMethod: (method) =>
        set({ paymentMethod: method, isDirty: true }),

      setFinancingOption: (option) =>
        set({ financingOption: option, isDirty: true }),

      // Meta Actions
      setProposalId: (id) => set({ proposalId: id }),

      setStatus: (status) => set({ status }),

      markSaved: () => set({ lastSaved: new Date(), isDirty: false }),

      setLoading: (loading) => set({ isLoading: loading }),

      // UI Actions
      setActiveSection: (section) => set({ activeSection: section }),

      nextSection: () =>
        set((state) => {
          const currentIndex = SECTION_ORDER.indexOf(state.activeSection);
          const nextIndex = Math.min(currentIndex + 1, SECTION_ORDER.length - 1);
          return { activeSection: SECTION_ORDER[nextIndex] };
        }),

      prevSection: () =>
        set((state) => {
          const currentIndex = SECTION_ORDER.indexOf(state.activeSection);
          const prevIndex = Math.max(currentIndex - 1, 0);
          return { activeSection: SECTION_ORDER[prevIndex] };
        }),

      setMode: (mode) => set({ mode }),

      toggleMode: () =>
        set((state) => ({
          mode: state.mode === "builder" ? "presentation" : "builder",
        })),

      setPresentationSlide: (slide) => set({ presentationSlide: slide }),

      nextSlide: () =>
        set((state) => {
          const currentIndex = SLIDE_ORDER.indexOf(state.presentationSlide);
          const nextIndex = Math.min(currentIndex + 1, SLIDE_ORDER.length - 1);
          return { presentationSlide: SLIDE_ORDER[nextIndex] };
        }),

      prevSlide: () =>
        set((state) => {
          const currentIndex = SLIDE_ORDER.indexOf(state.presentationSlide);
          const prevIndex = Math.max(currentIndex - 1, 0);
          return { presentationSlide: SLIDE_ORDER[prevIndex] };
        }),

      markSectionComplete: (section) =>
        set((state) => ({
          sectionProgress: { ...state.sectionProgress, [section]: true },
        })),

      // Calculation Actions
      calculatePricing: () => {
        const state = get();
        const equipmentPrice = state.selectedEquipment?.customerPrice || 0;
        const addOnsTotal = state.addOns
          .filter((a) => a.selected)
          .reduce((sum, a) => sum + a.customerPrice, 0);
        const maintenanceTotal = state.maintenancePlan
          ? state.maintenancePlan.price * state.maintenanceYears
          : 0;
        const subtotal = equipmentPrice + addOnsTotal + maintenanceTotal;
        const incentivesTotal = state.incentives
          .filter((i) => i.selected)
          .reduce((sum, i) => sum + i.amount, 0);
        const taxAmount = 0; // Tax calculated elsewhere if needed
        const grandTotal = subtotal - incentivesTotal + taxAmount;

        let monthlyPayment: number | null = null;
        if (state.paymentMethod !== "cash" && state.financingOption) {
          monthlyPayment = state.financingOption.monthlyPayment || null;
        }

        return {
          equipmentPrice,
          addOnsTotal,
          maintenanceTotal,
          subtotal,
          incentivesTotal,
          taxAmount,
          grandTotal,
          monthlyPayment,
        };
      },

      getCompletionPercentage: () => {
        const state = get();
        const completed = Object.values(state.sectionProgress).filter(Boolean).length;
        return Math.round((completed / SECTION_ORDER.length) * 100);
      },

      // Persistence Actions
      resetProposal: () =>
        set({
          customer: defaultCustomer,
          property: defaultProperty,
          currentSystem: defaultCurrentSystem,
          needs: defaultNeeds,
          selectedEquipment: null,
          addOns: [],
          maintenancePlan: null,
          maintenanceYears: 1,
          incentives: [],
          paymentMethod: "cash",
          financingOption: null,
          proposalId: null,
          status: "draft",
          lastSaved: null,
          isDirty: false,
          activeSection: "customer",
          mode: "builder",
          presentationSlide: "welcome",
          sectionProgress: {
            customer: false,
            property: false,
            "current-system": false,
            needs: false,
            equipment: false,
            "add-ons": false,
            maintenance: false,
            incentives: false,
            financing: false,
            review: false,
          },
        }),

      loadProposal: (data) =>
        set((state) => ({
          ...state,
          ...data,
          isDirty: false,
        })),
    }),
    {
      name: "proposal-draft",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customer: state.customer,
        property: state.property,
        currentSystem: state.currentSystem,
        needs: state.needs,
        selectedEquipment: state.selectedEquipment,
        addOns: state.addOns,
        maintenancePlan: state.maintenancePlan,
        maintenanceYears: state.maintenanceYears,
        incentives: state.incentives,
        paymentMethod: state.paymentMethod,
        financingOption: state.financingOption,
        proposalId: state.proposalId,
        status: state.status,
        activeSection: state.activeSection,
        sectionProgress: state.sectionProgress,
      }),
    }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const useCustomer = () => useProposalState((state) => state.customer);
export const useProperty = () => useProposalState((state) => state.property);
export const useCurrentSystem = () => useProposalState((state) => state.currentSystem);
export const useNeeds = () => useProposalState((state) => state.needs);
export const useSelectedEquipment = () => useProposalState((state) => state.selectedEquipment);
export const useAddOns = () => useProposalState((state) => state.addOns);
export const useMaintenancePlan = () => useProposalState((state) => state.maintenancePlan);
export const useIncentives = () => useProposalState((state) => state.incentives);
export const usePaymentMethod = () => useProposalState((state) => state.paymentMethod);
export const useFinancingOption = () => useProposalState((state) => state.financingOption);
export const useActiveSection = () => useProposalState((state) => state.activeSection);
export const useMode = () => useProposalState((state) => state.mode);
export const usePresentationSlide = () => useProposalState((state) => state.presentationSlide);
export const useSectionProgress = () => useProposalState((state) => state.sectionProgress);
export const useIsDirty = () => useProposalState((state) => state.isDirty);
export const useProposalId = () => useProposalState((state) => state.proposalId);
