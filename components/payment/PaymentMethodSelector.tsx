"use client";

import { DollarSign, CreditCard, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PaymentMethodType,
  PaymentMethodSelectorProps,
  PAYMENT_METHOD_OPTIONS,
} from "./types";

const ICONS: Record<PaymentMethodType, React.ReactNode> = {
  cash: <DollarSign className="w-6 h-6" />,
  financing: <CreditCard className="w-6 h-6" />,
  leasing: <Shield className="w-6 h-6" />,
};

const STAGGER_CLASSES = ["stagger-1", "stagger-2", "stagger-3"];

export function PaymentMethodSelector({
  selected,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      {PAYMENT_METHOD_OPTIONS.map((option, index) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "group relative flex flex-col items-start p-4 md:p-5 rounded-2xl border-2 text-left",
              "min-h-[120px] md:min-h-[160px]",
              "payment-card-enter",
              STAGGER_CLASSES[index],
              // Base transitions
              "transition-all duration-300 ease-out",
              // Touch feedback
              "active:scale-[0.98] active:transition-none",
              // Selected state with glow
              isSelected
                ? "border-primary bg-gradient-to-br from-primary/5 via-primary/3 to-transparent glow-primary"
                : "border-border bg-card hover:border-primary/40 hover:shadow-soft-md hover:-translate-y-0.5",
            )}
            aria-pressed={isSelected}
          >
            {/* Subtle gradient overlay on hover */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                "bg-gradient-to-br from-primary/5 to-transparent",
                !isSelected && "group-hover:opacity-100",
              )}
            />

            {/* Selection indicator with animation */}
            <div
              className={cn(
                "absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center",
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

            {/* Icon with enhanced styling */}
            <div
              className={cn(
                "relative p-2.5 rounded-xl mb-3 transition-all duration-300",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
              )}
            >
              {ICONS[option.id]}
            </div>

            {/* Content */}
            <div className="relative flex-1">
              <h3
                className={cn(
                  "text-lg font-semibold mb-1 transition-colors duration-200",
                  isSelected ? "text-primary" : "text-foreground",
                )}
              >
                {option.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {option.subtitle}
              </p>

              {/* Features with animated bullets */}
              <ul className="hidden md:block space-y-1.5">
                {option.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-muted-foreground flex items-center gap-2"
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        isSelected
                          ? "bg-primary scale-100"
                          : "bg-muted-foreground/40 scale-75 group-hover:scale-100 group-hover:bg-primary/60",
                      )}
                    />
                    <span className="group-hover:text-foreground/80 transition-colors">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </button>
        );
      })}
    </div>
  );
}
