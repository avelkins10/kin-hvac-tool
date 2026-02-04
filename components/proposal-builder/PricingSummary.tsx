"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Package,
  Sparkles,
  Shield,
  Gift,
  ChevronRight,
  Presentation,
} from "lucide-react";
import {
  useProposalState,
  useSelectedEquipment,
  useAddOns,
  useMaintenancePlan,
  useIncentives,
} from "./hooks/useProposalState";
import { AnimatedPrice } from "./shared/AnimatedPrice";

export function PricingSummary() {
  const selectedEquipment = useSelectedEquipment();
  const addOns = useAddOns();
  const maintenancePlan = useMaintenancePlan();
  const incentives = useIncentives();
  const { calculatePricing, toggleMode, maintenanceYears } = useProposalState();

  const pricing = useMemo(() => calculatePricing(), [calculatePricing]);

  const selectedAddOns = addOns.filter((a) => a.selected);
  const selectedIncentives = incentives.filter((i) => i.selected);

  const canPresent = selectedEquipment !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-lg font-heading font-bold text-sidebar-foreground">
          Pricing Summary
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Live pricing updates
        </p>
      </div>

      {/* Pricing Details */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Equipment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>Equipment</span>
          </div>
          {selectedEquipment ? (
            <div className="p-4 bg-muted/50 rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {selectedEquipment.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedEquipment.tier} tier
                  </p>
                </div>
                <AnimatedPrice
                  value={selectedEquipment.customerPrice}
                  className="font-price font-bold text-foreground"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-border rounded-xl text-center">
              <p className="text-sm text-muted-foreground">
                No equipment selected
              </p>
            </div>
          )}
        </div>

        {/* Add-ons */}
        {selectedAddOns.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>Add-Ons</span>
            </div>
            <div className="space-y-2">
              {selectedAddOns.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
                >
                  <span className="text-sm text-foreground">{addon.name}</span>
                  <AnimatedPrice
                    value={addon.customerPrice}
                    className="text-sm font-price font-medium"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintenance */}
        {maintenancePlan && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Maintenance</span>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {maintenancePlan.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {maintenanceYears} year{maintenanceYears > 1 ? "s" : ""}
                  </p>
                </div>
                <AnimatedPrice
                  value={maintenancePlan.price * maintenanceYears}
                  className="text-sm font-price font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Incentives */}
        {selectedIncentives.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <Gift className="w-4 h-4" />
              <span>Incentives Applied</span>
            </div>
            <div className="space-y-2">
              {selectedIncentives.map((incentive) => (
                <div
                  key={incentive.id}
                  className="flex items-center justify-between py-2 px-3 bg-success-light/50 rounded-lg"
                >
                  <span className="text-sm text-foreground">
                    {incentive.name}
                  </span>
                  <span className="text-sm font-price font-medium text-success">
                    -${incentive.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Total and CTA */}
      <div className="p-6 border-t border-sidebar-border bg-sidebar space-y-4">
        {/* Subtotal breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <AnimatedPrice value={pricing.subtotal} className="font-price" />
          </div>
          {pricing.incentivesTotal > 0 && (
            <div className="flex justify-between text-success">
              <span>Incentives</span>
              <span className="font-price">
                -${pricing.incentivesTotal.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">Total Investment</p>
          </div>
          <div className="text-right">
            <AnimatedPrice
              value={pricing.grandTotal}
              className="text-3xl font-heading font-bold text-foreground"
            />
            {pricing.monthlyPayment && (
              <p className="text-sm text-muted-foreground">
                or{" "}
                <span className="font-price font-semibold text-primary">
                  ${Math.round(pricing.monthlyPayment).toLocaleString()}/mo
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Present to Customer CTA */}
        <button
          onClick={toggleMode}
          disabled={!canPresent}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl",
            "font-semibold text-base transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            canPresent
              ? "bg-gradient-accent text-white hover:opacity-90 active:scale-[0.98] gradient-shimmer animate-pulse-glow"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Presentation className="w-5 h-5" />
          <span>Present to Customer</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {!canPresent && (
          <p className="text-xs text-center text-muted-foreground">
            Select equipment to enable presentation mode
          </p>
        )}
      </div>
    </div>
  );
}

export default PricingSummary;
