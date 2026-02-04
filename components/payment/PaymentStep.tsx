"use client";

import { useState, useMemo, useCallback } from "react";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { ComfortPlanCard } from "./ComfortPlanCard";
import { PaymentComparisonView } from "./PaymentComparisonView";
import { EscalatorExplainer } from "./EscalatorExplainer";
import { PaymentSummary } from "./PaymentSummary";
import { useEstimatedPricing } from "./hooks/useEstimatedPricing";
import {
  PaymentMethodType,
  FinancingOption,
  ComfortPlanOption,
  PaymentStepProps,
} from "./types";

// Helper to calculate monthly payment for traditional financing
function calculateFinanceMonthlyPayment(
  principal: number,
  option: FinancingOption,
): number {
  const termMonths = option.termMonths || 120;
  const annualRate = option.apr || 0;

  if (annualRate === 0) {
    return principal / termMonths;
  }

  const monthlyRate = annualRate / 100 / 12;
  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  );
}

export function PaymentStep({
  totalPrice,
  customerState,
  financingOptions,
  selectedPaymentMethod,
  selectedFinancingOption,
  onPaymentMethodChange,
  onFinancingOptionChange,
  proposalId,
  onShowFinanceForm,
}: PaymentStepProps) {
  // Local state for Comfort Plan selection (when using LightReach pricing)
  const [selectedComfortPlanId, setSelectedComfortPlanId] = useState<
    string | null
  >(null);
  const [viewMode, setViewMode] = useState<"cards" | "compare">("cards");

  // Fetch estimated pricing from LightReach
  const {
    options: comfortPlanOptions,
    isLoading: isPricingLoading,
    error: pricingError,
  } = useEstimatedPricing({
    state: customerState,
    totalFinancedAmount: totalPrice,
    enabled: selectedPaymentMethod === "leasing",
  });

  // Filter financing options by type
  const financeOptions = useMemo(
    () =>
      financingOptions.filter((opt) => opt.type === "finance" && opt.available),
    [financingOptions],
  );

  const leaseOptions = useMemo(
    () =>
      financingOptions.filter((opt) => opt.type === "lease" && opt.available),
    [financingOptions],
  );

  // Get selected comfort plan option
  const selectedComfortPlan = useMemo(() => {
    if (!selectedComfortPlanId) return null;
    return (
      comfortPlanOptions.find((opt) => opt.id === selectedComfortPlanId) || null
    );
  }, [selectedComfortPlanId, comfortPlanOptions]);

  // Calculate current monthly payment for summary
  const currentMonthlyPayment = useMemo(() => {
    if (selectedPaymentMethod === "cash") return null;

    if (selectedPaymentMethod === "leasing" && selectedComfortPlan) {
      return selectedComfortPlan.year1Payment;
    }

    if (selectedPaymentMethod === "financing" && selectedFinancingOption) {
      return calculateFinanceMonthlyPayment(
        totalPrice,
        selectedFinancingOption,
      );
    }

    return null;
  }, [
    selectedPaymentMethod,
    selectedComfortPlan,
    selectedFinancingOption,
    totalPrice,
  ]);

  // Handle comfort plan selection
  const handleComfortPlanSelect = useCallback(
    (optionId: string) => {
      setSelectedComfortPlanId(optionId);

      // Find the corresponding financing option to update parent state
      const comfortOption = comfortPlanOptions.find(
        (opt) => opt.id === optionId,
      );
      if (comfortOption) {
        // Find or create a matching financing option for the parent
        const matchingLease = leaseOptions.find(
          (opt) =>
            opt.termMonths === comfortOption.termMonths &&
            Math.abs((opt.escalatorRate || 0) - comfortOption.escalatorRate) <
              0.01,
        );

        if (matchingLease) {
          onFinancingOptionChange(matchingLease);
        } else {
          // Create a synthetic financing option from comfort plan
          const syntheticOption: FinancingOption = {
            id: comfortOption.id,
            name: comfortOption.name,
            type: "lease",
            provider: "LightReach",
            termMonths: comfortOption.termMonths,
            escalatorRate: comfortOption.escalatorRate,
            available: true,
          };
          onFinancingOptionChange(syntheticOption);
        }
      }
    },
    [comfortPlanOptions, leaseOptions, onFinancingOptionChange],
  );

  // Handle finance option selection
  const handleFinanceSelect = useCallback(
    (option: FinancingOption) => {
      onFinancingOptionChange(option);
    },
    [onFinancingOptionChange],
  );

  // Handle continue
  const handleContinue = useCallback(() => {
    // This would typically advance to the next step
    // For now, we just ensure the selection is valid
  }, []);

  return (
    <div className="space-y-6">
      {/* Payment Method Selector */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>
        <PaymentMethodSelector
          selected={selectedPaymentMethod}
          onChange={onPaymentMethodChange}
        />
      </section>

      {/* Cash Payment Display with enhanced styling */}
      {selectedPaymentMethod === "cash" && (
        <section className="payment-card-enter stagger-1 p-6 md:p-8 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-2 border-primary rounded-2xl glow-primary">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-3">
                <Check className="w-3 h-3" />
                Best for ownership
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                Pay in Full
              </h3>
              <p className="text-sm text-muted-foreground">
                One-time payment - own your system outright with no monthly
                obligations
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="flex items-baseline gap-1 md:justify-end">
                <span className="text-sm text-muted-foreground font-medium">
                  $
                </span>
                <span className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
                  {totalPrice.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total price • No interest
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Finance Options */}
      {selectedPaymentMethod === "financing" && (
        <section>
          <h3 className="text-lg font-semibold mb-2">Select Financing Term</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Monthly payments based on ${totalPrice.toLocaleString()} system
            price
          </p>

          {financeOptions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-xl">
              No financing options available
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {financeOptions.map((option) => {
                const monthlyPayment = calculateFinanceMonthlyPayment(
                  totalPrice,
                  option,
                );
                const isSelected = selectedFinancingOption?.id === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleFinanceSelect(option)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      "active:scale-[0.98]",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{option.name}</h4>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-bold text-primary">
                        ${monthlyPayment.toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    {option.apr !== undefined && option.apr > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {option.apr}% APR
                      </p>
                    )}
                    {option.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {option.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Leasing / Comfort Plan Options */}
      {selectedPaymentMethod === "leasing" && (
        <section>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                Choose Your Comfort Plan
              </h3>
              <p className="text-sm text-muted-foreground">
                All-inclusive lease with $0 down and maintenance included
              </p>
            </div>
            <EscalatorExplainer />
          </div>

          {/* Loading state with skeleton cards */}
          {isPricingLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-5 rounded-2xl border-2 border-border/50 payment-card-enter",
                      `stagger-${i}`,
                    )}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-16 rounded shimmer" />
                      <div className="h-5 w-12 rounded-full shimmer" />
                    </div>
                    <div className="h-10 w-24 rounded shimmer mb-2" />
                    <div className="h-4 w-20 rounded shimmer mb-4" />
                    <div className="pt-3 border-t border-border/40 space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 w-16 rounded shimmer" />
                        <div className="h-4 w-14 rounded shimmer" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 w-14 rounded shimmer" />
                        <div className="h-4 w-16 rounded shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  Loading pricing from LightReach...
                </span>
              </div>
            </div>
          )}

          {/* Error state */}
          {pricingError && !isPricingLoading && (
            <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">
                    Unable to load pricing
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pricingError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comfort Plan options */}
          {!isPricingLoading &&
            !pricingError &&
            comfortPlanOptions.length > 0 && (
              <>
                {/* View toggle for desktop */}
                <div className="hidden md:flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg transition-colors",
                      viewMode === "cards"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    Card View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("compare")}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg transition-colors",
                      viewMode === "compare"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    Compare All
                  </button>
                </div>

                {/* Cards view with staggered animation */}
                {viewMode === "cards" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {comfortPlanOptions.map((option, index) => (
                      <ComfortPlanCard
                        key={option.id}
                        option={option}
                        isSelected={selectedComfortPlanId === option.id}
                        onSelect={() => handleComfortPlanSelect(option.id)}
                        className={cn(
                          "payment-card-enter",
                          `stagger-${Math.min(index + 1, 6)}`,
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Comparison view */}
                {viewMode === "compare" && (
                  <PaymentComparisonView
                    options={comfortPlanOptions}
                    selectedId={selectedComfortPlanId}
                    onSelect={handleComfortPlanSelect}
                  />
                )}

                {/* Mobile always shows comparison as horizontal scroll */}
                <div className="md:hidden mt-4">
                  <PaymentComparisonView
                    options={comfortPlanOptions}
                    selectedId={selectedComfortPlanId}
                    onSelect={handleComfortPlanSelect}
                  />
                </div>
              </>
            )}

          {/* Fallback to static options if no LightReach pricing */}
          {!isPricingLoading &&
            !pricingError &&
            comfortPlanOptions.length === 0 &&
            leaseOptions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {leaseOptions.map((option) => {
                  const isSelected = selectedFinancingOption?.id === option.id;
                  const escalator = option.escalatorRate || 0;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleFinanceSelect(option)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        "active:scale-[0.98]",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{option.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {escalator}% Escalator
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      {option.description && (
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

          {/* Finance application link for LightReach */}
          {proposalId &&
            selectedFinancingOption?.provider?.toLowerCase() ===
              "lightreach" && (
              <div className="mt-6 p-4 bg-muted/50 border border-border rounded-xl">
                <p className="text-sm text-muted-foreground mb-3">
                  Ready to apply? Complete the finance application to get
                  started.
                </p>
                {onShowFinanceForm && (
                  <button
                    type="button"
                    onClick={onShowFinanceForm}
                    className="text-primary font-medium hover:underline"
                  >
                    Start Finance Application →
                  </button>
                )}
              </div>
            )}
        </section>
      )}

      {/* Payment Summary */}
      <PaymentSummary
        paymentMethod={selectedPaymentMethod}
        monthlyPayment={currentMonthlyPayment}
        totalPrice={totalPrice}
        selectedOption={selectedComfortPlan || selectedFinancingOption}
        onContinue={handleContinue}
      />
    </div>
  );
}
