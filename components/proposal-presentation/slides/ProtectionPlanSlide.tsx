"use client";

import { Shield, Check, Star, Award, Crown } from "lucide-react";
import {
  useMaintenancePlan,
  useProposalState,
} from "../../proposal-builder/hooks/useProposalState";
import { AnimatedPrice } from "../../proposal-builder/shared/AnimatedPrice";
import { cn } from "@/lib/utils";

const TIER_ICONS = {
  basic: <Star className="w-6 h-6" />,
  standard: <Award className="w-6 h-6" />,
  premium: <Crown className="w-6 h-6" />,
};

const TIER_COLORS = {
  basic: "from-gray-500 to-gray-600",
  standard: "from-primary-500 to-primary-700",
  premium: "from-accent-orange to-accent-orange-dark",
};

export function ProtectionPlanSlide() {
  const plan = useMaintenancePlan();
  const { maintenanceYears } = useProposalState();

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-full px-8 py-16">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">
            No Maintenance Plan Selected
          </h2>
          <p className="text-muted-foreground max-w-md">
            You can add a maintenance plan later to protect your investment and
            keep your system running efficiently.
          </p>
        </div>
      </div>
    );
  }

  const totalCost = plan.price * maintenanceYears;

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 slide-enter">
            Protection & Maintenance
          </h2>
          <p className="text-lg text-muted-foreground slide-enter stagger-2">
            Keep your system running at peak performance
          </p>
        </div>

        {/* Plan card */}
        <div className="bg-card border-2 border-primary rounded-2xl overflow-hidden shadow-warm-xl slide-enter stagger-3">
          {/* Header gradient */}
          <div
            className={cn(
              "px-8 py-6 bg-gradient-to-r text-white flex items-center gap-4",
              TIER_COLORS[plan.tier]
            )}
          >
            {TIER_ICONS[plan.tier]}
            <div>
              <h3 className="text-2xl font-heading font-bold">{plan.name}</h3>
              <p className="text-white/80">{plan.description}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Coverage period */}
            <div className="flex items-center justify-center gap-8 mb-8 p-4 bg-muted/50 rounded-xl">
              <div className="text-center">
                <p className="text-3xl font-bold font-price text-foreground">
                  {maintenanceYears}
                </p>
                <p className="text-sm text-muted-foreground">
                  Year{maintenanceYears > 1 ? "s" : ""} Coverage
                </p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold font-price text-foreground">
                  {plan.visitsPerYear}
                </p>
                <p className="text-sm text-muted-foreground">
                  Visit{plan.visitsPerYear > 1 ? "s" : ""}/Year
                </p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold font-price text-foreground">
                  {plan.visitsPerYear * maintenanceYears}
                </p>
                <p className="text-sm text-muted-foreground">Total Visits</p>
              </div>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {plan.features.map((feature, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 p-3 bg-success/5 rounded-lg payment-card-enter",
                    `stagger-${(index % 4) + 1}`
                  )}
                >
                  <Check className="w-5 h-5 text-success shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="border-t border-border pt-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    ${plan.price.toLocaleString()}/year × {maintenanceYears}{" "}
                    year{maintenanceYears > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Investment
                  </p>
                  <AnimatedPrice
                    value={totalCost}
                    className="text-4xl font-heading font-bold text-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value callout */}
        <div className="mt-6 text-center text-muted-foreground slide-enter stagger-5">
          <p className="text-sm">
            Regular maintenance can extend your system's life by{" "}
            <span className="font-semibold text-foreground">5+ years</span> and
            reduce energy costs by up to{" "}
            <span className="font-semibold text-foreground">15%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProtectionPlanSlide;
