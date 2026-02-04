"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useProposalState } from "./hooks/useProposalState";

interface BuilderLayoutProps {
  leftSidebar: ReactNode;
  children: ReactNode;
  rightSidebar: ReactNode;
  className?: string;
}

export function BuilderLayout({
  leftSidebar,
  children,
  rightSidebar,
  className,
}: BuilderLayoutProps) {
  return (
    <div className={cn("flex min-h-screen", className)}>
      {/* Left Sidebar - Section Navigation */}
      <aside className="hidden lg:flex lg:w-72 xl:w-80 flex-col border-r border-border bg-sidebar shrink-0">
        <div className="flex-1 overflow-y-auto">{leftSidebar}</div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <div className="h-full overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </div>
      </main>

      {/* Right Sidebar - Pricing Summary */}
      <aside className="hidden xl:flex xl:w-80 2xl:w-96 flex-col border-l border-border bg-sidebar shrink-0">
        <div className="flex-1 overflow-y-auto sticky top-0">
          {rightSidebar}
        </div>
      </aside>

      {/* Mobile Bottom Bar for Pricing */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-warm-lg z-40">
        <div className="p-4">
          {/* Mobile pricing summary will be rendered here */}
          <MobilePricingSummary />
        </div>
      </div>
    </div>
  );
}

// Mobile version of pricing summary - compact view
function MobilePricingSummary() {
  // This will connect to Zustand state
  const { calculatePricing, toggleMode, selectedEquipment } =
    useProposalState();
  const pricing = calculatePricing();

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-2xl font-bold font-price text-foreground">
          ${pricing.grandTotal.toLocaleString()}
        </p>
      </div>
      <button
        onClick={toggleMode}
        disabled={!selectedEquipment}
        className={cn(
          "px-6 py-3 rounded-xl font-semibold text-sm transition-all",
          "bg-gradient-accent text-white",
          "hover:opacity-90 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "gradient-shimmer",
        )}
      >
        Present to Customer
      </button>
    </div>
  );
}

export default BuilderLayout;
