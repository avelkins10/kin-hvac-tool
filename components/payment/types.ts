// Payment Step Types and Interfaces

export type PaymentMethodType = "cash" | "financing" | "leasing";

export interface PaymentMethodOption {
  id: PaymentMethodType;
  title: string;
  subtitle: string;
  features: string[];
  icon?: string;
}

export interface EscalatorRate {
  value: number;
  label: string;
  color: "low" | "mid" | "high";
}

export interface MonthlyPaymentSchedule {
  year: number;
  monthlyPayment: number;
  yearlyCost: number;
}

export interface ComfortPlanProduct {
  productId: string;
  name: string;
  type: "lease";
  escalationRate: number;
  termYears: number;
  monthlyPayments: MonthlyPaymentSchedule[];
  totalAmountPaid: number;
}

export interface EstimatedPricingResponse {
  products: ComfortPlanProduct[];
}

export interface ComfortPlanOption {
  id: string;
  productId: string;
  name: string;
  termYears: number;
  termMonths: number;
  escalatorRate: number;
  year1Payment: number;
  year10Payment: number;
  totalCost: number;
  monthlyPayments: MonthlyPaymentSchedule[];
  isRecommended?: boolean;
}

export interface FinancingOption {
  id: string;
  name: string;
  type: "finance" | "lease";
  provider?: string;
  termMonths: number;
  apr?: number;
  description?: string;
  available: boolean;
  escalatorRate?: number;
}

export interface PaymentStepProps {
  totalPrice: number;
  customerState: string;
  financingOptions: FinancingOption[];
  selectedPaymentMethod: PaymentMethodType;
  selectedFinancingOption: FinancingOption | null;
  onPaymentMethodChange: (method: PaymentMethodType) => void;
  onFinancingOptionChange: (option: FinancingOption | null) => void;
  proposalId?: string;
  onShowFinanceForm?: () => void;
}

export interface PaymentMethodSelectorProps {
  selected: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
}

export interface ComfortPlanCardProps {
  option: ComfortPlanOption;
  isSelected: boolean;
  onSelect: () => void;
}

export interface PaymentComparisonViewProps {
  options: ComfortPlanOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export interface PaymentSummaryProps {
  paymentMethod: PaymentMethodType;
  monthlyPayment: number | null;
  totalPrice: number;
  selectedOption?: ComfortPlanOption | FinancingOption | null;
  onContinue: () => void;
}

export interface EscalatorExplainerProps {
  className?: string;
}

// Helper function to get escalator color class
export function getEscalatorColor(rate: number): "low" | "mid" | "high" {
  if (rate === 0) return "low";
  if (rate <= 0.99) return "mid";
  return "high";
}

// Helper function to get escalator badge classes
export function getEscalatorBadgeClasses(rate: number): string {
  const color = getEscalatorColor(rate);
  switch (color) {
    case "low":
      return "bg-escalator-low/10 text-escalator-low border-escalator-low/20";
    case "mid":
      return "bg-escalator-mid/10 text-escalator-mid border-escalator-mid/20";
    case "high":
      return "bg-escalator-high/10 text-escalator-high border-escalator-high/20";
  }
}

// Payment method cards configuration
export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    id: "cash",
    title: "Pay in Full",
    subtitle: "Own your system outright",
    features: ["No monthly payments", "Full ownership", "No interest"],
  },
  {
    id: "financing",
    title: "Finance",
    subtitle: "Traditional loan options",
    features: ["Build equity", "Fixed APR", "Own after payoff"],
  },
  {
    id: "leasing",
    title: "Comfort Plan",
    subtitle: "All-inclusive lease",
    features: ["$0 down", "Maintenance included", "Worry-free coverage"],
  },
];

// Transform LightReach API response to ComfortPlanOption
export function transformToComfortPlanOptions(
  products: ComfortPlanProduct[],
): ComfortPlanOption[] {
  // Guard against undefined/null products
  if (!products || !Array.isArray(products)) {
    return [];
  }

  return products
    .filter((product) => product && product.monthlyPayments) // Filter out invalid products
    .map((product, index) => {
      const payments = product.monthlyPayments || [];
      const year1 = payments.find((p) => p.year === 1);
      const year10 = payments.find((p) => p.year === 10);
      const lastPayment =
        payments.length > 0 ? payments[payments.length - 1] : null;

      return {
        id: `comfort-plan-${index}`,
        productId: product.productId || "",
        name: product.name || "",
        termYears: product.termYears || 0,
        termMonths: (product.termYears || 0) * 12,
        escalatorRate: product.escalationRate || 0,
        year1Payment: year1?.monthlyPayment ?? 0,
        year10Payment:
          year10?.monthlyPayment ?? lastPayment?.monthlyPayment ?? 0,
        totalCost: product.totalAmountPaid || 0,
        monthlyPayments: payments,
        // Mark 10-year 0% as recommended (lowest risk, predictable payments)
        isRecommended: product.termYears === 10 && product.escalationRate === 0,
      };
    });
}
