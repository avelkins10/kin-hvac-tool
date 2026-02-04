"use client";

import { AlertTriangle, Clock, Wrench, ThermometerSun } from "lucide-react";
import { useCurrentSystem, useNeeds } from "../../proposal-builder/hooks/useProposalState";
import { cn } from "@/lib/utils";

export function CurrentSituationSlide() {
  const currentSystem = useCurrentSystem();
  const needs = useNeeds();

  const issues = currentSystem.issues || [];
  const hasAIAnalysis = currentSystem.aiAnalysisComplete;

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 slide-enter">
            Your Current Situation
          </h2>
          <p className="text-lg text-muted-foreground slide-enter stagger-2">
            Understanding where we're starting from
          </p>
        </div>

        {/* System info cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Current system card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-warm slide-enter stagger-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <ThermometerSun className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Current System</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">
                  {currentSystem.equipmentType || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Age</span>
                <span className="font-medium">
                  {currentSystem.systemAge || "Unknown"} old
                </span>
              </div>
              {hasAIAnalysis && currentSystem.brand && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Brand</span>
                  <span className="font-medium">{currentSystem.brand}</span>
                </div>
              )}
              {hasAIAnalysis && currentSystem.tonnage && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{currentSystem.tonnage} tons</span>
                </div>
              )}
              {hasAIAnalysis && currentSystem.seerRating && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Efficiency</span>
                  <span className="font-medium">{currentSystem.seerRating} SEER</span>
                </div>
              )}
            </div>
          </div>

          {/* Issues card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-warm slide-enter stagger-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-warning" />
              </div>
              <h3 className="font-semibold text-lg">Concerns Identified</h3>
            </div>

            {issues.length > 0 ? (
              <ul className="space-y-2">
                {issues.map((issue, index) => (
                  <li
                    key={index}
                    className={cn(
                      "flex items-center gap-2 p-2 bg-warning/5 rounded-lg text-sm payment-card-enter",
                      `stagger-${index + 1}`
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                No specific issues reported, but your system may be ready for an
                upgrade.
              </p>
            )}
          </div>
        </div>

        {/* Priority highlight */}
        {needs.priority && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center slide-enter stagger-5">
            <p className="text-sm text-muted-foreground mb-2">
              Your Top Priority
            </p>
            <p className="text-xl font-heading font-bold text-primary capitalize">
              {needs.priority === "comfort"
                ? "Maximum Comfort"
                : needs.priority === "efficiency"
                ? "Energy Efficiency"
                : "Budget Friendly"}
            </p>
          </div>
        )}

        {/* Age warning */}
        {currentSystem.systemAge &&
          (currentSystem.systemAge.includes("15") ||
            currentSystem.systemAge.includes("20") ||
            currentSystem.systemAge === "20+") && (
            <div className="mt-6 flex items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl slide-enter stagger-6">
              <Clock className="w-6 h-6 text-destructive shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">System age alert:</span> Most HVAC
                systems last 15-20 years. Your system is approaching or past its
                expected lifespan.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

export default CurrentSituationSlide;
