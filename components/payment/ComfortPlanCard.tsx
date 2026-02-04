"use client";

import { Check, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComfortPlanCardProps, getEscalatorColor } from "./types";

export function ComfortPlanCard({
  option,
  isSelected,
  onSelect,
  className,
}: ComfortPlanCardProps & { className?: string }) {
  const escalatorColor = getEscalatorColor(option.escalatorRate);

  const escalatorColorClasses = {
    low: "bg-escalator-low/15 text-escalator-low border-escalator-low/40",
    mid: "bg-escalator-mid/15 text-escalator-mid border-escalator-mid/40",
    high: "bg-escalator-high/15 text-escalator-high border-escalator-high/40",
  };

  const escalatorBgGradient = {
    low: "from-escalator-low/5 to-transparent",
    mid: "from-escalator-mid/5 to-transparent",
    high: "from-escalator-high/5 to-transparent",
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full p-4 md:p-5 rounded-2xl border-2 text-left",
        "transition-all duration-300 ease-out",
        "active:scale-[0.98] active:transition-none",
        // Recommended card gets special treatment
        option.isRecommended && !isSelected && "pulse-subtle",
        isSelected
          ? "border-primary bg-gradient-to-br from-primary/5 via-primary/3 to-transparent glow-primary"
          : cn(
              "border-border bg-card hover:border-primary/40 hover:shadow-soft-md hover:-translate-y-0.5",
              option.isRecommended && "border-primary/30",
            ),
        className,
      )}
      aria-pressed={isSelected}
    >
      {/* Subtle escalator-colored gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
          "bg-gradient-to-br",
          escalatorBgGradient[escalatorColor],
          !isSelected && "group-hover:opacity-100",
        )}
      />

      {/* Recommended badge with shine effect */}
      {option.isRecommended && (
        <div className="absolute -top-3 left-4 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-primary to-primary-600 text-primary-foreground text-xs font-semibold rounded-full shadow-md badge-shine">
          <Sparkles className="w-3 h-3" />
          Best Value
        </div>
      )}

      {/* Selection indicator with animation */}
      <div
        className={cn(
          "absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center",
          "transition-all duration-300",
          isSelected
            ? "border-primary bg-primary scale-100"
            : "border-muted-foreground/30 scale-90 group-hover:scale-100 group-hover:border-primary/50",
        )}
      >
        <Check
          className={cn(
            "w-3 h-3 text-white transition-all duration-200",
            isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50",
          )}
        />
      </div>

      {/* Header: Term and Escalator */}
      <div className="relative flex items-center gap-2 mb-3 pr-8">
        <span
          className={cn(
            "text-lg font-bold transition-colors duration-200",
            isSelected ? "text-primary" : "text-foreground",
          )}
        >
          {option.termYears} Year
        </span>
        <span
          className={cn(
            "px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-all duration-200",
            escalatorColorClasses[escalatorColor],
          )}
        >
          {option.escalatorRate}%
        </span>
      </div>

      {/* Main price with enhanced typography */}
      <div className="relative mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-sm text-muted-foreground font-medium">$</span>
          <span
            className={cn(
              "text-4xl font-bold tracking-tight transition-colors duration-200",
              isSelected ? "text-primary" : "text-foreground",
            )}
          >
            {option.year1Payment.toFixed(0)}
          </span>
          <span className="text-muted-foreground font-medium">/mo</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Starting payment</p>
      </div>

      {/* Details with improved visual hierarchy */}
      <div className="relative space-y-2 pt-3 border-t border-border/60">
        {option.escalatorRate > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Year {option.termYears}
            </span>
            <span className="font-semibold text-foreground">
              $
              {option.monthlyPayments[
                option.monthlyPayments.length - 1
              ]?.monthlyPayment.toFixed(0)}
              /mo
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total cost</span>
          <span className="font-semibold text-foreground">
            ${option.totalCost.toLocaleString()}
          </span>
        </div>
      </div>
    </button>
  );
}
