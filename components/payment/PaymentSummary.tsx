"use client";

import {
  ChevronRight,
  DollarSign,
  Calendar,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaymentSummaryProps, PaymentMethodType } from "./types";

const METHOD_LABELS: Record<PaymentMethodType, string> = {
  cash: "Pay in Full",
  financing: "Finance",
  leasing: "Comfort Plan",
};

const METHOD_ICONS: Record<PaymentMethodType, React.ReactNode> = {
  cash: <DollarSign className="w-5 h-5" />,
  financing: <Calendar className="w-5 h-5" />,
  leasing: <Shield className="w-5 h-5" />,
};

export function PaymentSummary({
  paymentMethod,
  monthlyPayment,
  totalPrice,
  selectedOption,
  onContinue,
}: PaymentSummaryProps) {
  const hasSelection =
    paymentMethod === "cash" ||
    (paymentMethod === "financing" && selectedOption) ||
    (paymentMethod === "leasing" && selectedOption);

  // Format display values
  const displayPrice =
    paymentMethod === "cash"
      ? `$${totalPrice.toLocaleString()}`
      : monthlyPayment
        ? `$${monthlyPayment.toFixed(0)}/mo`
        : "Select an option";

  const displayLabel =
    paymentMethod === "cash"
      ? "One-time payment"
      : selectedOption && "termYears" in selectedOption
        ? `${selectedOption.termYears} year plan`
        : selectedOption && "termMonths" in selectedOption
          ? `${Math.floor(selectedOption.termMonths / 12)} year loan`
          : METHOD_LABELS[paymentMethod];

  return (
    <>
      {/* Desktop: Inline summary with enhanced styling */}
      <div className="hidden md:flex items-center justify-between p-5 bg-gradient-to-r from-muted/80 via-muted/60 to-muted/40 rounded-2xl border border-border/80 shadow-soft">
        <div className="flex items-center gap-5">
          <div
            className={cn(
              "p-3 rounded-xl transition-all duration-300",
              hasSelection
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted-foreground/10 text-muted-foreground",
            )}
          >
            {METHOD_ICONS[paymentMethod]}
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              {displayLabel}
            </p>
            <p
              className={cn(
                "text-3xl font-bold tracking-tight transition-colors duration-200",
                hasSelection ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {displayPrice}
            </p>
          </div>
        </div>
        <Button
          onClick={onContinue}
          disabled={!hasSelection}
          size="lg"
          className={cn(
            "gap-2 px-6 h-12 text-base font-semibold rounded-xl transition-all duration-300",
            hasSelection && "shadow-md hover:shadow-lg hover:-translate-y-0.5",
          )}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile: Fixed bottom bar with frosted glass effect */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-pb">
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-background/80 glass-blur border-t border-border/60" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "p-2.5 rounded-xl shrink-0 transition-all duration-300",
                hasSelection
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {METHOD_ICONS[paymentMethod]}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium truncate">
                {displayLabel}
              </p>
              <p
                className={cn(
                  "text-xl font-bold truncate transition-colors duration-200",
                  hasSelection ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {displayPrice}
              </p>
            </div>
          </div>
          <Button
            onClick={onContinue}
            disabled={!hasSelection}
            size="lg"
            className={cn(
              "gap-1.5 shrink-0 min-w-[44px] min-h-[44px] px-5 rounded-xl font-semibold",
              "transition-all duration-300",
              hasSelection && "shadow-md active:scale-95",
            )}
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Spacer for mobile to prevent content from being hidden behind fixed bar */}
      <div className="md:hidden h-28" />
    </>
  );
}
