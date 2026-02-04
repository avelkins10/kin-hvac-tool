"use client";

import { DollarSign, Gift, Check } from "lucide-react";
import {
  useProposalState,
  useSelectedEquipment,
  useAddOns,
  useMaintenancePlan,
  useIncentives,
} from "../../proposal-builder/hooks/useProposalState";
import { PriceReveal } from "../animations/PriceReveal";
import { AnimatedPrice } from "../../proposal-builder/shared/AnimatedPrice";
import { cn } from "@/lib/utils";

export function InvestmentSlide() {
  const { calculatePricing, maintenanceYears } = useProposalState();
  const equipment = useSelectedEquipment();
  const addOns = useAddOns();
  const maintenancePlan = useMaintenancePlan();
  const incentives = useIncentives();

  const pricing = calculatePricing();
  const selectedAddOns = addOns.filter((a) => a.selected);
  const selectedIncentives = incentives.filter((i) => i.selected);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 slide-enter">
            Your Investment
          </h2>
          <p className="text-lg text-muted-foreground slide-enter stagger-2">
            Complete breakdown of your comfort solution
          </p>
        </div>

        {/* Pricing breakdown */}
        <div className="bg-card border border-border rounded-2xl shadow-warm-lg overflow-hidden slide-enter stagger-3">
          <div className="p-6 space-y-4">
            {/* Equipment */}
            {equipment && (
              <div className="flex justify-between items-center py-3 border-b border-border">
                <div>
                  <p className="font-medium">{equipment.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {equipment.tier} tier system
                  </p>
                </div>
                <AnimatedPrice
                  value={equipment.customerPrice}
                  className="text-lg font-bold"
                />
              </div>
            )}

            {/* Add-ons */}
            {selectedAddOns.length > 0 && (
              <div className="py-3 border-b border-border">
                <p className="font-medium mb-2">Enhancements</p>
                {selectedAddOns.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex justify-between items-center py-1"
                  >
                    <p className="text-sm text-muted-foreground">{addon.name}</p>
                    <span className="text-sm">
                      ${addon.customerPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Maintenance */}
            {maintenancePlan && (
              <div className="flex justify-between items-center py-3 border-b border-border">
                <div>
                  <p className="font-medium">{maintenancePlan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {maintenanceYears} year{maintenanceYears > 1 ? "s" : ""}
                  </p>
                </div>
                <AnimatedPrice
                  value={maintenancePlan.price * maintenanceYears}
                  className="text-lg font-bold"
                />
              </div>
            )}

            {/* Subtotal */}
            <div className="flex justify-between items-center py-3 border-b border-border">
              <p className="font-medium">Subtotal</p>
              <AnimatedPrice
                value={pricing.subtotal}
                className="text-lg font-bold"
              />
            </div>

            {/* Incentives */}
            {selectedIncentives.length > 0 && (
              <div className="py-3 border-b border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-success" />
                  <p className="font-medium text-success">Incentives Applied</p>
                </div>
                {selectedIncentives.map((incentive) => (
                  <div
                    key={incentive.id}
                    className="flex justify-between items-center py-1"
                  >
                    <p className="text-sm text-muted-foreground">
                      {incentive.name}
                    </p>
                    <span className="text-sm text-success">
                      -${incentive.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grand total */}
          <div className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Total Investment
            </p>
            <PriceReveal
              value={pricing.grandTotal}
              duration={1500}
              delay={500}
              showCelebration
              className="text-5xl md:text-6xl font-heading font-bold text-primary"
            />

            {pricing.monthlyPayment && (
              <p className="mt-4 text-muted-foreground">
                or as low as{" "}
                <span className="text-xl font-bold text-foreground">
                  ${Math.round(pricing.monthlyPayment).toLocaleString()}/month
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Value highlights */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center slide-enter stagger-4">
          <div>
            <Check className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Professional Install</p>
          </div>
          <div>
            <Check className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Permits Included</p>
          </div>
          <div>
            <Check className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Full Warranty</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvestmentSlide;
