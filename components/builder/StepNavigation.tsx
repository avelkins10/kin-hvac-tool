"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StepNavigationProps {
  currentStep: string;
  steps: string[];
  onNext: () => void;
  onPrevious: () => void;
  canProceed: boolean;
  estimatedTime?: number;
}

export function StepNavigation({
  currentStep,
  steps,
  onNext,
  onPrevious,
  canProceed,
  estimatedTime,
}: StepNavigationProps) {
  const currentIndex = steps.indexOf(currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  return (
    <div className="flex justify-between items-center mb-6 px-2">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirst}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="w-5 h-5" />
        Previous
      </Button>

      <div className="flex items-center gap-4">
        {estimatedTime && (
          <span className="text-sm text-muted-foreground hidden sm:block">
            ~{estimatedTime} min
          </span>
        )}
        <span className="text-base font-medium text-foreground">
          Step {currentIndex + 1} of {steps.length}
        </span>
      </div>

      <Button
        onClick={onNext}
        disabled={!canProceed || isLast}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
