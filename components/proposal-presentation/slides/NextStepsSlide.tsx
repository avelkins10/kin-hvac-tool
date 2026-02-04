"use client";

import {
  CheckCircle2,
  ArrowRight,
  Calendar,
  FileText,
  Phone,
  Mail,
} from "lucide-react";
import {
  useCustomer,
  useProposalState,
  useSelectedEquipment,
} from "../../proposal-builder/hooks/useProposalState";
import { AnimatedPrice } from "../../proposal-builder/shared/AnimatedPrice";
import { cn } from "@/lib/utils";

const NEXT_STEPS = [
  {
    number: 1,
    title: "Approve Your Proposal",
    description: "Review and sign the agreement electronically",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    number: 2,
    title: "Schedule Installation",
    description: "Choose a date that works for your schedule",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    number: 3,
    title: "Professional Installation",
    description: "Our certified team handles everything",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
];

export function NextStepsSlide() {
  const customer = useCustomer();
  const equipment = useSelectedEquipment();
  const { calculatePricing, toggleMode } = useProposalState();

  const pricing = calculatePricing();
  const firstName = customer.name.split(" ")[0] || "there";

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 slide-enter">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground slide-enter stagger-2">
            Let's bring comfort home, {firstName}
          </p>
        </div>

        {/* Summary card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-warm slide-enter stagger-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Your Package</p>
              <p className="text-xl font-semibold text-foreground">
                {equipment?.name || "Custom System"}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-muted-foreground">Total Investment</p>
              <AnimatedPrice
                value={pricing.grandTotal}
                className="text-3xl font-heading font-bold text-primary"
              />
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="space-y-4 mb-10">
          {NEXT_STEPS.map((step, index) => (
            <div
              key={step.number}
              className={cn(
                "flex items-start gap-4 p-4 bg-muted/30 rounded-xl payment-card-enter",
                `stagger-${index + 1}`
              )}
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground font-bold">
                {step.number}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-primary">{step.icon}</span>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 slide-enter stagger-5">
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl",
              "bg-gradient-accent text-white font-semibold text-lg",
              "hover:opacity-90 active:scale-[0.98] transition-all gradient-shimmer"
            )}
          >
            Approve Proposal
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={toggleMode}
            className={cn(
              "flex items-center justify-center gap-2 px-8 py-4 rounded-xl",
              "border-2 border-primary text-primary font-semibold",
              "hover:bg-primary/5 active:scale-[0.98] transition-all"
            )}
          >
            Back to Builder
          </button>
        </div>

        {/* Contact info */}
        <div className="text-center text-muted-foreground slide-enter stagger-6">
          <p className="text-sm mb-3">Have questions? We're here to help!</p>
          <div className="flex items-center justify-center gap-6">
            <a
              href="tel:+18005551234"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Phone className="w-4 h-4" />
              <span>Call Us</span>
            </a>
            <a
              href="mailto:support@example.com"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="w-4 h-4" />
              <span>Email Us</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NextStepsSlide;
