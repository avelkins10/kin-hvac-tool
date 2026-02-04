"use client";

import { useCallback, useMemo, useEffect } from "react";
import { Gift, Check, Info, DollarSign, FileText, Percent } from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import { AnimatedPrice } from "../shared/AnimatedPrice";
import {
  useProposalState,
  useIncentives,
  type Incentive,
} from "../hooks/useProposalState";
import { useIncentives as useIncentivesContext } from "@/src/contexts/IncentivesContext";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  rebate: <DollarSign className="w-5 h-5" />,
  tax_credit: <FileText className="w-5 h-5" />,
  discount: <Percent className="w-5 h-5" />,
};

const TYPE_LABELS = {
  rebate: "Rebate",
  tax_credit: "Tax Credit",
  discount: "Discount",
};

const TYPE_COLORS = {
  rebate: "bg-success/10 text-success border-success/20",
  tax_credit: "bg-primary/10 text-primary border-primary/20",
  discount: "bg-accent-orange/10 text-accent-orange border-accent-orange/20",
};

export function IncentivesSection() {
  const incentives = useIncentives();
  const { setIncentives, toggleIncentive, markSectionComplete } = useProposalState();
  const { incentives: contextIncentives } = useIncentivesContext();

  // Initialize incentives from context
  useEffect(() => {
    if (contextIncentives.length > 0 && incentives.length === 0) {
      const transformed: Incentive[] = contextIncentives.map((inc) => ({
        id: inc.id,
        name: inc.name,
        amount: inc.amount,
        type: inc.type,
        description: inc.description,
        requirements: inc.requirements,
        selected: false,
      }));
      setIncentives(transformed);
    }
  }, [contextIncentives, incentives.length, setIncentives]);

  const selectedIncentives = incentives.filter((i) => i.selected);
  const totalSavings = selectedIncentives.reduce((sum, i) => sum + i.amount, 0);

  const handleContinue = useCallback(() => {
    markSectionComplete("incentives");
  }, [markSectionComplete]);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Available Incentives"
        description="Rebates and tax credits that may apply to your project"
        icon={<Gift className="w-6 h-6" />}
      />

      {incentives.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-2xl">
          <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No incentives available at this time.
          </p>
          <button
            onClick={handleContinue}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Incentives list */}
          <div className="space-y-4">
            {incentives.map((incentive, index) => {
              const isSelected = incentive.selected;

              return (
                <button
                  key={incentive.id}
                  onClick={() => toggleIncentive(incentive.id)}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border-2 transition-all payment-card-enter",
                    "hover:shadow-warm card-hover",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected
                      ? "border-success bg-success/5 glow-success"
                      : "border-border bg-card hover:border-success/30",
                    `stagger-${index + 1}`
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Type badge and info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                            TYPE_COLORS[incentive.type]
                          )}
                        >
                          {TYPE_ICONS[incentive.type]}
                          {TYPE_LABELS[incentive.type]}
                        </span>
                      </div>

                      <h3 className="font-semibold text-foreground text-lg">
                        {incentive.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {incentive.description}
                      </p>

                      {/* Requirements */}
                      {incentive.requirements && incentive.requirements.length > 0 && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                            <Info className="w-3.5 h-3.5" />
                            Requirements
                          </div>
                          <ul className="space-y-1">
                            {incentive.requirements.map((req, i) => (
                              <li
                                key={i}
                                className="text-xs text-muted-foreground flex items-start gap-1.5"
                              >
                                <span className="text-muted-foreground/50">•</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Amount and selection */}
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-success text-3xl font-bold font-price">
                          ${incentive.amount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">savings</p>

                      {/* Checkbox indicator */}
                      <div
                        className={cn(
                          "mt-3 w-6 h-6 rounded-md border-2 flex items-center justify-center ml-auto transition-all",
                          isSelected
                            ? "bg-success border-success"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && (
                          <Check className="w-4 h-4 text-white animate-checkmark" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Total savings */}
          <div
            className={cn(
              "p-5 rounded-2xl transition-all",
              totalSavings > 0
                ? "bg-success/10 border-2 border-success/30"
                : "bg-muted/30"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {selectedIncentives.length} incentive
                  {selectedIncentives.length !== 1 ? "s" : ""} selected
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalSavings > 0
                    ? "These savings will be applied to your final price"
                    : "Select applicable incentives to see your savings"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <AnimatedPrice
                  value={totalSavings}
                  className="text-2xl font-bold text-success"
                />
              </div>
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 active:scale-[0.99] transition-all"
          >
            Continue to Payment Options
          </button>
        </div>
      )}
    </div>
  );
}

export default IncentivesSection;
