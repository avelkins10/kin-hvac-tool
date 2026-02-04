"use client";

import { useCallback, useMemo } from "react";
import { CreditCard, Check, DollarSign, Calendar, Wallet } from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import { AnimatedPrice } from "../shared/AnimatedPrice";
import {
  useProposalState,
  usePaymentMethod,
  useFinancingOption,
  useSelectedEquipment,
  useAddOns,
  useMaintenancePlan,
  useIncentives,
  type PaymentMethod,
} from "../hooks/useProposalState";
import { PaymentStep } from "@/components/payment";
import { usePriceBook, type FinancingOption as PriceBookFinancingOption } from "@/src/contexts/PriceBookContext";
import { useCustomer } from "../hooks/useProposalState";
import { cn } from "@/lib/utils";

export function FinancingSection() {
  const paymentMethod = usePaymentMethod();
  const financingOption = useFinancingOption();
  const selectedEquipment = useSelectedEquipment();
  const addOns = useAddOns();
  const maintenancePlan = useMaintenancePlan();
  const incentives = useIncentives();
  const customer = useCustomer();
  const {
    setPaymentMethod,
    setFinancingOption,
    markSectionComplete,
    maintenanceYears,
    proposalId,
  } = useProposalState();
  const { financingOptions } = usePriceBook();

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = selectedEquipment?.customerPrice || 0;
    total += addOns.filter((a) => a.selected).reduce((sum, a) => sum + a.customerPrice, 0);
    if (maintenancePlan) {
      total += maintenancePlan.price * maintenanceYears;
    }
    total -= incentives.filter((i) => i.selected).reduce((sum, i) => sum + i.amount, 0);
    return Math.max(0, total);
  }, [selectedEquipment, addOns, maintenancePlan, maintenanceYears, incentives]);

  // Transform financing options for PaymentStep
  const paymentFinancingOptions = useMemo(() => {
    return financingOptions.map((opt) => ({
      id: opt.id,
      name: opt.name,
      type: opt.type as "finance" | "lease",
      provider: opt.provider,
      termMonths: opt.termMonths,
      apr: opt.apr,
      description: opt.description,
      available: opt.available,
      escalatorRate: opt.type === "lease" && opt.provider === "Lightreach"
        ? (opt.name.includes("1.99%") ? 1.99 : opt.name.includes("0.99%") ? 0.99 : 0)
        : undefined,
    }));
  }, [financingOptions]);

  // Map payment method between our types and PaymentStep types
  const handlePaymentMethodChange = useCallback(
    (method: "cash" | "financing" | "leasing") => {
      setPaymentMethod(method);
    },
    [setPaymentMethod]
  );

  const handleFinancingOptionChange = useCallback(
    (option: any) => {
      if (option) {
        setFinancingOption({
          id: option.id,
          name: option.name,
          type: option.type,
          provider: option.provider,
          termMonths: option.termMonths,
          apr: option.apr,
          description: option.description,
          escalatorRate: option.escalatorRate,
        });
      } else {
        setFinancingOption(null);
      }
    },
    [setFinancingOption]
  );

  const handleContinue = useCallback(() => {
    markSectionComplete("financing");
  }, [markSectionComplete]);

  // Get customer state for pricing
  const customerState = customer.state || "SC";

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Payment Options"
        description="Choose how you'd like to pay for your new system"
        icon={<CreditCard className="w-6 h-6" />}
      />

      {/* Price summary */}
      <div className="p-5 bg-muted/30 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">System Total</p>
            <p className="text-sm text-muted-foreground">
              Equipment, add-ons, and maintenance
            </p>
          </div>
          <AnimatedPrice
            value={totalPrice}
            className="text-3xl font-heading font-bold text-foreground"
          />
        </div>
      </div>

      {/* Payment selection using existing PaymentStep component */}
      <PaymentStep
        totalPrice={totalPrice}
        customerState={customerState}
        financingOptions={paymentFinancingOptions}
        selectedPaymentMethod={paymentMethod}
        selectedFinancingOption={financingOption as any}
        onPaymentMethodChange={handlePaymentMethodChange}
        onFinancingOptionChange={handleFinancingOptionChange}
        proposalId={proposalId || undefined}
      />

      {/* Continue button */}
      <button
        onClick={handleContinue}
        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.99] transition-all"
      >
        Continue to Review
      </button>
    </div>
  );
}

export default FinancingSection;
