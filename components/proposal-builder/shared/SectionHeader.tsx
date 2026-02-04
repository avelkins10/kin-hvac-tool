"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProposalState } from "../hooks/useProposalState";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  showNavigation?: boolean;
}

export function SectionHeader({
  title,
  description,
  icon,
  className,
  showNavigation = true,
}: SectionHeaderProps) {
  const { nextSection, prevSection, activeSection } = useProposalState();

  const isFirstSection = activeSection === "customer";
  const isLastSection = activeSection === "review";

  return (
    <div className={cn("mb-8", className)}>
      {/* Navigation buttons for mobile */}
      {showNavigation && (
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            onClick={prevSection}
            disabled={isFirstSection}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <button
            onClick={nextSection}
            disabled={isLastSection}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors",
              "text-primary hover:bg-primary/10",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header content */}
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SectionHeader;
