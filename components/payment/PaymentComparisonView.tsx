"use client";

import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentComparisonViewProps, getEscalatorColor } from "./types";

export function PaymentComparisonView({
  options = [],
  selectedId,
  onSelect,
}: PaymentComparisonViewProps) {
  // Guard against undefined/empty options
  if (!options || options.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No comfort plan options available
      </div>
    );
  }

  // Group by term
  const optionsByTerm = options.reduce(
    (acc, option) => {
      const term = option.termYears;
      if (!acc[term]) acc[term] = [];
      acc[term].push(option);
      return acc;
    },
    {} as Record<number, typeof options>,
  );

  const sortedTerms = Object.keys(optionsByTerm)
    .map(Number)
    .sort((a, b) => a - b);

  const escalatorColorClasses = {
    low: "text-escalator-low",
    mid: "text-escalator-mid",
    high: "text-escalator-high",
  };

  return (
    <div className="space-y-6">
      {/* Desktop: Full comparison table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                Term
              </th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                Escalator
              </th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                Year 1
              </th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                Final Year
              </th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                Total Cost
              </th>
              <th className="w-20 py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const isSelected = selectedId === option.id;
              const escalatorColor = getEscalatorColor(option.escalatorRate);
              const finalYearPayment =
                option.monthlyPayments[option.monthlyPayments.length - 1]
                  ?.monthlyPayment ?? 0;

              return (
                <tr
                  key={option.id}
                  onClick={() => onSelect(option.id)}
                  className={cn(
                    "border-b border-border/50 cursor-pointer transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/50",
                  )}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {option.termYears} Year
                      </span>
                      {option.isRecommended && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                          <Star className="w-3 h-3 fill-current" />
                          Best
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        "font-medium",
                        escalatorColorClasses[escalatorColor],
                      )}
                    >
                      {option.escalatorRate}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-medium">
                    ${(option.year1Payment ?? 0).toFixed(0)}/mo
                  </td>
                  <td className="py-4 px-4 text-right">
                    ${finalYearPayment.toFixed(0)}/mo
                  </td>
                  <td className="py-4 px-4 text-right">
                    ${(option.totalCost ?? 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center mx-auto transition-all",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Horizontal scroll cards by term */}
      <div className="md:hidden space-y-6">
        {sortedTerms.map((term) => (
          <div key={term}>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
              {term} Year Options
            </h4>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
              {optionsByTerm[term]
                .sort((a, b) => a.escalatorRate - b.escalatorRate)
                .map((option) => {
                  const isSelected = selectedId === option.id;
                  const escalatorColor = getEscalatorColor(
                    option.escalatorRate,
                  );
                  const finalYearPayment =
                    option.monthlyPayments[option.monthlyPayments.length - 1]
                      ?.monthlyPayment ?? 0;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onSelect(option.id)}
                      className={cn(
                        "relative flex-shrink-0 w-[200px] p-4 rounded-xl border-2 text-left snap-start transition-all",
                        "active:scale-[0.98]",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border",
                      )}
                    >
                      {option.isRecommended && (
                        <div className="absolute -top-2 left-3 flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                          <Star className="w-3 h-3 fill-current" />
                          Best
                        </div>
                      )}

                      <div
                        className={cn(
                          "text-xs font-medium mb-2",
                          escalatorColorClasses[escalatorColor],
                        )}
                      >
                        {option.escalatorRate}% escalator
                      </div>

                      <div className="text-2xl font-bold text-primary mb-1">
                        ${(option.year1Payment ?? 0).toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /mo
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Year {option.termYears}</span>
                          <span>${finalYearPayment.toFixed(0)}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total</span>
                          <span>
                            ${(option.totalCost ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
