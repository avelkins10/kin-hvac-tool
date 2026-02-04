"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
  className?: string;
  variant?: "horizontal" | "circular";
}

export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps = [],
  className,
  variant = "horizontal",
}: ProgressIndicatorProps) {
  if (variant === "circular") {
    const progress = (completedSteps.length / steps.length) * 100;
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={cn("relative inline-flex", className)}>
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-primary progress-animate"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-heading font-bold text-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;
        const isPast = index < currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            {/* Step indicator */}
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                "text-sm font-semibold",
                isCompleted
                  ? "bg-success text-white"
                  : isCurrent
                  ? "bg-primary text-primary-foreground animate-pulse-glow"
                  : isPast
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 section-complete" />
              ) : (
                index + 1
              )}
            </div>

            {/* Step label (visible on larger screens) */}
            <span
              className={cn(
                "hidden sm:block text-sm transition-colors",
                isCurrent
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step}
            </span>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 transition-colors",
                  isCompleted || isPast ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ProgressIndicator;
