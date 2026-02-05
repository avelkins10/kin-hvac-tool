// Finance helper utilities for Comfort Plan detection and validation

interface Proposal {
  id: string;
  paymentMethod?: {
    method?: string;
    option?: any;
  } | null;
  financingOption?: {
    provider?: string;
    id?: string;
    name?: string;
    type?: string;
  } | null;
  [key: string]: any;
}

interface FinancingOption {
  id: string;
  provider?: string;
  type?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Check if a proposal has Comfort Plan (LightReach HVAC lease) selected
 */
export function isComfortPlanSelected(proposal: Proposal): boolean {
  if (!proposal) return false;

  const paymentMethod = proposal.paymentMethod;
  const financingOption = proposal.financingOption;

  // Check if leasing is selected
  const isLeasing = paymentMethod?.method === "leasing";

  // Check if LightReach/Palmetto provider is selected
  const provider = financingOption?.provider || paymentMethod?.option?.provider;
  const isLightReach =
    provider?.toLowerCase() === "lightreach" ||
    provider?.toLowerCase() === "palmetto";

  return isLeasing && isLightReach;
}

/**
 * Get the selected Comfort Plan financing option from a proposal
 */
export function getComfortPlanOption(
  proposal: Proposal,
): FinancingOption | null {
  if (!isComfortPlanSelected(proposal)) {
    return null;
  }

  return proposal.financingOption || proposal.paymentMethod?.option || null;
}

/**
 * Determine if finance application UI should be shown for a proposal
 */
export function shouldShowFinanceApplication(proposal: Proposal): boolean {
  if (!proposal || !proposal.id) {
    return false;
  }

  return isComfortPlanSelected(proposal);
}

/**
 * Extract customer data from proposal for pre-filling finance application form
 */
export function extractCustomerDataFromProposal(proposal: Proposal): {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
} {
  const customerData = proposal.customerData as any;

  if (!customerData) {
    return {};
  }

  // Handle different possible formats
  const name = customerData.name || "";
  const nameParts = name.split(" ").filter(Boolean);
  const firstName = nameParts[0] || customerData.firstName || "";
  const lastName = nameParts.slice(1).join(" ") || customerData.lastName || "";

  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: customerData.email?.trim() || "",
    phone: customerData.phone?.trim() || "",
    address: customerData.address?.trim() || "",
    city: customerData.city?.trim() || "",
    state: customerData.state?.trim() || "",
    zip: customerData.zip?.trim() || "",
  };
}

/**
 * Get system price from proposal totals
 */
export function getSystemPriceFromProposal(proposal: Proposal): number {
  const totals = proposal.totals as any;
  if (totals?.total) {
    return totals.total;
  }
  if (totals?.equipment) {
    return totals.equipment;
  }
  return 0;
}

/**
 * Build Palmetto HVAC systemDesign from proposal for more accurate pricing.
 * Used when fetching payment schedule / pricing so Palmetto can return pricing based on equipment.
 * See LightReach API: POST /api/v2/accounts/{accountId}/pricing/hvac
 *
 * @param proposal - The proposal object containing homeData and selectedEquipment
 * @param options - Options for building the system design
 * @param options.isPreliminary - Whether this is a preliminary estimate (true) or final design (false)
 * @param options.includeSerialNumbers - Whether to include serial numbers (for install package)
 */
export function buildSystemDesignFromProposal(
  proposal: {
    homeData?: any;
    selectedEquipment?: any;
  },
  options: {
    isPreliminary?: boolean;
    includeSerialNumbers?: boolean;
    totalSystemCost?: number;
  } = {},
): HVACSystemDesign | undefined {
  const {
    isPreliminary = true,
    includeSerialNumbers = false,
    totalSystemCost,
  } = options;

  const homeData = proposal?.homeData as
    | {
        squareFootage?: number;
        homeType?: string;
        stories?: number;
      }
    | undefined;

  const equipment = proposal?.selectedEquipment as
    | {
        tier?: string;
        seer?: number;
        seer2?: number;
        hspf?: number;
        hspf2?: number;
        tonnage?: number;
        name?: string;
        manufacturer?: string;
        model?: string;
        type?: string;
        serialNumber?: string;
        components?: Array<{
          type?: string;
          name?: string;
          manufacturer?: string;
          model?: string;
          serialNumber?: string;
          quantity?: number;
        }>;
        ahriNumber?: string;
      }
    | undefined;

  const conditionedArea = homeData?.squareFootage;
  if (!conditionedArea || conditionedArea <= 0) return undefined;

  // Determine tonnage based on square footage if not provided
  const tonnageValue =
    equipment?.tonnage ??
    (conditionedArea <= 1500 ? 2.5 : conditionedArea <= 2500 ? 3.5 : 4);

  // Determine efficiency values
  const seerValue = equipment?.seer2 || equipment?.seer || 16;
  const hspfValue = equipment?.hspf2 || equipment?.hspf;

  // Determine system category based on equipment tier/type
  let systemCategory: HVACSystemCategory = "Conventional Ducted Split System";
  if (
    equipment?.tier === "best" ||
    equipment?.type?.toLowerCase().includes("heat pump")
  ) {
    systemCategory = "Heat Pump Split System";
  } else if (equipment?.type?.toLowerCase().includes("mini split")) {
    systemCategory = "Single Zone Mini Split";
  } else if (equipment?.type?.toLowerCase().includes("packaged")) {
    systemCategory = "Package";
  } else if (equipment?.tier === "better") {
    systemCategory = "Heat Pump Split System";
  }

  // Determine equipment type
  let equipmentType: HVACEquipmentType = "airConditioner";
  if (systemCategory === "Heat Pump Split System") {
    equipmentType = "heatPump";
  } else if (systemCategory.includes("Mini Split")) {
    equipmentType = "ductlessOutdoor";
  }

  // Build equipment items
  const equipmentItems: HVACEquipmentItem[] = [];

  // Main unit
  const mainItem: HVACEquipmentItem = {
    type: equipmentType,
    name:
      equipment?.name ||
      `${equipment?.manufacturer || "HVAC"} ${systemCategory}`,
    manufacturer: equipment?.manufacturer || "",
    model: equipment?.model || "",
    quantity: 1,
    size: { unit: "ton", value: String(tonnageValue) },
    efficiencies: [{ unit: "SEER2", value: String(seerValue) }],
  };

  // Add HSPF for heat pumps
  if (hspfValue && equipmentType === "heatPump") {
    mainItem.efficiencies!.push({ unit: "HSPF2", value: String(hspfValue) });
  }

  // Add serial number if available and requested
  if (includeSerialNumbers && equipment?.serialNumber) {
    mainItem.serialNumbers = [equipment.serialNumber];
  }

  equipmentItems.push(mainItem);

  // Add additional components if available
  if (equipment?.components) {
    for (const comp of equipment.components) {
      if (!comp.type) continue;

      const compItem: HVACEquipmentItem = {
        type: mapComponentType(comp.type),
        name: comp.name || comp.type,
        manufacturer: comp.manufacturer || equipment?.manufacturer || "",
        model: comp.model || "",
        quantity: comp.quantity || 1,
      };

      if (includeSerialNumbers && comp.serialNumber) {
        compItem.serialNumbers = [comp.serialNumber];
      }

      equipmentItems.push(compItem);
    }
  }

  return {
    isPreliminary,
    systems: [
      {
        systemCategory,
        conditionedArea: Number(conditionedArea),
        name: equipment?.name,
        ahriNumber: equipment?.ahriNumber,
        equipment: {
          items: equipmentItems,
          ...(totalSystemCost && { totalCost: totalSystemCost }),
        },
      },
    ],
  };
}

/**
 * Map component type string to HVACEquipmentType
 */
function mapComponentType(type: string): HVACEquipmentType {
  const typeMap: Record<string, HVACEquipmentType> = {
    "air handler": "airHandler",
    airhandler: "airHandler",
    "heat strip": "heatStrip",
    heatstrip: "heatStrip",
    furnace: "furnace",
    "evaporator coil": "evaporatorCoil",
    evaporatorcoil: "evaporatorCoil",
    coil: "evaporatorCoil",
    "heat pump": "heatPump",
    heatpump: "heatPump",
    "air conditioner": "airConditioner",
    airconditioner: "airConditioner",
    ac: "airConditioner",
    condenser: "airConditioner",
  };

  const normalized = type.toLowerCase().trim();
  return typeMap[normalized] || "other";
}

// ============================================================================
// Type Definitions (matching lightreach.ts)
// ============================================================================

export type HVACSystemCategory =
  | "Conventional Ducted Split System"
  | "Conventional Ducted System"
  | "Package"
  | "Ductless Mini Split"
  | "Ducted Mini Split"
  | "Heat Pump Split System"
  | "Gas Conventional Split System"
  | "Dual Fuel Split System"
  | "Packaged Heat Pump"
  | "Packaged Gas/Electric"
  | "Packaged Dual Fuel"
  | "Single Zone Mini Split"
  | "Multi Zone Mini Split"
  | "Air Conditioning/Air Handler Split System";

export type HVACEquipmentType =
  | "heatPump"
  | "airHandler"
  | "heatStrip"
  | "furnace"
  | "evaporatorCoil"
  | "ductlessOutdoor"
  | "ductlessIndoor"
  | "airConditioner"
  | "packagedAC"
  | "packagedHeatPump"
  | "packagedGasAC"
  | "packagedDualFuel"
  | "other";

export interface HVACEquipmentItem {
  type: HVACEquipmentType;
  name: string;
  manufacturer: string;
  model: string;
  quantity: number;
  productId?: string;
  serialNumbers?: string[];
  size?: {
    unit: string;
    value: string;
  };
  efficiencies?: Array<{
    unit: string;
    value: string;
  }>;
}

export interface HVACSystemDesign {
  isPreliminary?: boolean;
  systems: Array<{
    systemCategory: HVACSystemCategory;
    conditionedArea: number;
    name?: string;
    ahriNumber?: string;
    equipment: {
      items: HVACEquipmentItem[];
      totalCost?: number;
    };
  }>;
}
