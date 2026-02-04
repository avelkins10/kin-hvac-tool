"use client";

import { useCallback, useMemo, useEffect } from "react";
import { Shield, Check, Star, Award, Crown } from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import { AnimatedPrice } from "../shared/AnimatedPrice";
import {
  useProposalState,
  useMaintenancePlan,
  type MaintenancePlan,
} from "../hooks/useProposalState";
import { useMaintenance, type MaintenancePlan as ContextPlan } from "@/src/contexts/MaintenanceContext";
import { cn } from "@/lib/utils";

const TIER_ICONS = {
  basic: <Star className="w-5 h-5" />,
  standard: <Award className="w-5 h-5" />,
  premium: <Crown className="w-5 h-5" />,
};

const TIER_COLORS = {
  basic: "from-gray-500 to-gray-600",
  standard: "from-primary-500 to-primary-600",
  premium: "from-accent-orange to-accent-orange-dark",
};

const YEAR_OPTIONS = [1, 3, 5, 7];

export function MaintenanceSection() {
  const selectedPlan = useMaintenancePlan();
  const { setMaintenancePlan, maintenanceYears, setMaintenanceYears, markSectionComplete } =
    useProposalState();
  const { plans, bundleDiscounts, getPlanSalesPrice, getBundleTotal } = useMaintenance();

  // Transform context plans to component format
  const planOptions: MaintenancePlan[] = useMemo(() => {
    return plans
      .filter((plan) => plan.enabled)
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        description: plan.description,
        price: getPlanSalesPrice(plan),
        visitsPerYear: plan.visitsPerYear,
        features: plan.features,
      }));
  }, [plans, getPlanSalesPrice]);

  const handleSelectPlan = useCallback(
    (plan: MaintenancePlan) => {
      setMaintenancePlan(plan);
    },
    [setMaintenancePlan]
  );

  const handleSelectYears = useCallback(
    (years: number) => {
      setMaintenanceYears(years);
    },
    [setMaintenanceYears]
  );

  const handleSkip = useCallback(() => {
    setMaintenancePlan(null);
    markSectionComplete("maintenance");
  }, [setMaintenancePlan, markSectionComplete]);

  const handleContinue = useCallback(() => {
    markSectionComplete("maintenance");
  }, [markSectionComplete]);

  // Calculate bundle discount
  const bundleInfo = useMemo(() => {
    if (!selectedPlan) return null;
    const discount = bundleDiscounts.find((d) => d.years === maintenanceYears);
    const total = selectedPlan.price * maintenanceYears;
    const discountAmount = discount ? Math.round(total * (discount.discountPercent / 100)) : 0;
    return {
      total,
      discountPercent: discount?.discountPercent || 0,
      discountAmount,
      finalPrice: total - discountAmount,
      badge: discount?.badge,
    };
  }, [selectedPlan, maintenanceYears, bundleDiscounts]);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Maintenance & Protection"
        description="Keep your system running at peak performance"
        icon={<Shield className="w-6 h-6" />}
      />

      <div className="space-y-8">
        {/* Plan selection */}
        <div className="grid gap-4">
          {planOptions.map((plan, index) => {
            const isSelected = selectedPlan?.id === plan.id;

            return (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan)}
                className={cn(
                  "relative w-full text-left rounded-2xl border-2 overflow-hidden transition-all payment-card-enter",
                  "hover:shadow-warm-lg card-hover",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary glow-primary"
                    : "border-border hover:border-primary/30",
                  `stagger-${index + 1}`
                )}
              >
                {/* Tier header */}
                <div
                  className={cn(
                    "px-5 py-3 bg-gradient-to-r text-white flex items-center justify-between",
                    TIER_COLORS[plan.tier]
                  )}
                >
                  <div className="flex items-center gap-2">
                    {TIER_ICONS[plan.tier]}
                    <span className="font-heading font-bold">{plan.name}</span>
                  </div>
                  <span className="text-sm opacity-90">
                    {plan.visitsPerYear} visit{plan.visitsPerYear > 1 ? "s" : ""}/year
                  </span>
                </div>

                {/* Content */}
                <div className={cn("p-5", isSelected ? "bg-primary/5" : "bg-card")}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-3">
                        {plan.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-1.5">
                        {plan.features.slice(0, 4).map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <Check
                              className={cn(
                                "w-4 h-4 mt-0.5 shrink-0",
                                isSelected ? "text-primary" : "text-success"
                              )}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 4 && (
                          <li className="text-xs text-primary ml-6">
                            +{plan.features.length - 4} more benefits
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Price */}
                    <div className="text-right ml-4">
                      <AnimatedPrice
                        value={plan.price}
                        className="text-2xl font-bold text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">/year</p>
                      {isSelected && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                          <Check className="w-3 h-3" />
                          Selected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Multi-year bundle */}
        {selectedPlan && (
          <div className="p-5 bg-muted/30 rounded-2xl animate-bounce-in">
            <h3 className="font-semibold text-foreground mb-3">
              Multi-Year Bundle Savings
            </h3>
            <div className="flex flex-wrap gap-2">
              {YEAR_OPTIONS.map((years) => {
                const discount = bundleDiscounts.find((d) => d.years === years);
                const isSelected = maintenanceYears === years;

                return (
                  <button
                    key={years}
                    onClick={() => handleSelectYears(years)}
                    className={cn(
                      "relative px-4 py-2 rounded-xl font-medium transition-all",
                      "border-2 hover:border-primary/50",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground"
                    )}
                  >
                    {years} Year{years > 1 ? "s" : ""}
                    {discount && discount.discountPercent > 0 && (
                      <span className="ml-1 text-xs text-success">
                        Save {discount.discountPercent}%
                      </span>
                    )}
                    {discount?.badge && (
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-accent-orange text-white text-[10px] font-bold rounded-full">
                        {discount.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bundle summary */}
            {bundleInfo && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {selectedPlan.name} - {maintenanceYears} Year
                      {maintenanceYears > 1 ? "s" : ""}
                    </p>
                    {bundleInfo.discountPercent > 0 && (
                      <p className="text-sm text-success">
                        {bundleInfo.discountPercent}% bundle discount applied
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {bundleInfo.discountAmount > 0 && (
                      <p className="text-sm text-muted-foreground line-through">
                        ${bundleInfo.total.toLocaleString()}
                      </p>
                    )}
                    <AnimatedPrice
                      value={bundleInfo.finalPrice}
                      className="text-2xl font-bold text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 border-2 border-border text-muted-foreground rounded-xl font-medium hover:border-primary/30 hover:text-foreground transition-all"
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 active:scale-[0.99] transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default MaintenanceSection;
