"use client";

import { CreditCard, Check, DollarSign, Calendar, Shield } from "lucide-react";
import {
  useProposalState,
  usePaymentMethod,
  useFinancingOption,
} from "../../proposal-builder/hooks/useProposalState";
import { AnimatedPrice } from "../../proposal-builder/shared/AnimatedPrice";
import { cn } from "@/lib/utils";

const PAYMENT_OPTIONS = [
  {
    id: "cash",
    title: "Pay in Full",
    description: "Own your system outright",
    icon: <DollarSign className="w-6 h-6" />,
    benefits: ["No monthly payments", "Full ownership", "No interest charges"],
  },
  {
    id: "financing",
    title: "Financing",
    description: "Traditional loan options",
    icon: <CreditCard className="w-6 h-6" />,
    benefits: ["Build equity", "Fixed monthly payments", "Own after payoff"],
  },
  {
    id: "leasing",
    title: "Comfort Plan",
    description: "All-inclusive lease",
    icon: <Shield className="w-6 h-6" />,
    benefits: ["$0 down payment", "Maintenance included", "Worry-free coverage"],
  },
];

export function PaymentOptionsSlide() {
  const { calculatePricing } = useProposalState();
  const paymentMethod = usePaymentMethod();
  const financingOption = useFinancingOption();

  const pricing = calculatePricing();

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 slide-enter">
            Payment Options
          </h2>
          <p className="text-lg text-muted-foreground slide-enter stagger-2">
            Choose the option that works best for you
          </p>
        </div>

        {/* Payment options cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {PAYMENT_OPTIONS.map((option, index) => {
            const isSelected = paymentMethod === option.id;

            return (
              <div
                key={option.id}
                className={cn(
                  "bg-card border-2 rounded-2xl p-6 transition-all payment-card-enter",
                  isSelected
                    ? "border-primary shadow-warm-lg glow-primary"
                    : "border-border",
                  `stagger-${index + 1}`
                )}
              >
                {/* Icon and header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {option.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                <ul className="space-y-2 mb-4">
                  {option.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check
                        className={cn(
                          "w-4 h-4",
                          isSelected ? "text-primary" : "text-success"
                        )}
                      />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* Price display */}
                {option.id === "cash" && (
                  <div className="pt-4 border-t border-border">
                    <AnimatedPrice
                      value={pricing.grandTotal}
                      className="text-2xl font-bold text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">one-time</p>
                  </div>
                )}

                {option.id === "financing" && pricing.monthlyPayment && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">From</p>
                    <p>
                      <span className="text-2xl font-bold text-foreground">
                        ${Math.round(pricing.monthlyPayment).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">/mo</span>
                    </p>
                  </div>
                )}

                {option.id === "leasing" && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">$0 down</p>
                    <p className="text-2xl font-bold text-foreground">
                      All-inclusive
                    </p>
                  </div>
                )}

                {/* Selected indicator */}
                {isSelected && (
                  <div className="mt-4 flex items-center justify-center gap-2 py-2 bg-primary/10 rounded-lg text-primary text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Selected
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected option details */}
        {paymentMethod && financingOption && paymentMethod !== "cash" && (
          <div className="bg-muted/30 rounded-2xl p-6 text-center slide-enter stagger-4">
            <p className="text-sm text-muted-foreground mb-2">
              Your Selected Option
            </p>
            <p className="text-xl font-semibold text-foreground">
              {financingOption.name}
            </p>
            {financingOption.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {financingOption.description}
              </p>
            )}
          </div>
        )}

        {/* Financing note */}
        <p className="mt-6 text-center text-sm text-muted-foreground slide-enter stagger-5">
          Subject to credit approval. Terms and rates may vary based on
          creditworthiness.
        </p>
      </div>
    </div>
  );
}

export default PaymentOptionsSlide;
