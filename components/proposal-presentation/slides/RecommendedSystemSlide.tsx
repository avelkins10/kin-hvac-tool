"use client";

import { Package, Check, Zap, ThermometerSun, Volume2, Shield } from "lucide-react";
import { useSelectedEquipment } from "../../proposal-builder/hooks/useProposalState";
import { AnimatedPrice } from "../../proposal-builder/shared/AnimatedPrice";
import { cn } from "@/lib/utils";

const TIER_NAMES = {
  good: "Essential",
  better: "Premium",
  best: "Ultimate",
};

const TIER_DESCRIPTIONS = {
  good: "Reliable comfort at a great value",
  better: "Enhanced performance and efficiency",
  best: "Maximum comfort and energy savings",
};

export function RecommendedSystemSlide() {
  const equipment = useSelectedEquipment();

  if (!equipment) {
    return (
      <div className="flex items-center justify-center min-h-full px-8 py-16">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">
            No System Selected
          </h2>
          <p className="text-muted-foreground">
            Please select an equipment package to continue.
          </p>
        </div>
      </div>
    );
  }

  const tierDescription = TIER_DESCRIPTIONS[equipment.tier];

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6 animate-bounce-in">
            <Zap className="w-4 h-4" />
            <span>{TIER_NAMES[equipment.tier]} Tier</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 slide-enter">
            Your Recommended System
          </h2>
          <p className="text-lg text-muted-foreground slide-enter stagger-2">
            {tierDescription}
          </p>
        </div>

        {/* Main equipment card */}
        <div className="bg-card border-2 border-primary rounded-2xl overflow-hidden shadow-warm-xl mb-8 slide-enter stagger-3">
          {/* Header gradient */}
          <div
            className={cn(
              "px-8 py-6 bg-gradient-to-r text-white",
              equipment.tier === "best"
                ? "from-accent-orange to-accent-orange-dark"
                : equipment.tier === "better"
                ? "from-primary-500 to-primary-700"
                : "from-gray-500 to-gray-600"
            )}
          >
            <h3 className="text-2xl font-heading font-bold">{equipment.name}</h3>
            <p className="text-white/80 mt-1">{equipment.description}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Key specs */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold font-price text-foreground">
                  {equipment.seer}
                </p>
                <p className="text-sm text-muted-foreground">SEER Rating</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <ThermometerSun className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xl font-bold text-foreground">
                  {equipment.tier === "best"
                    ? "Variable"
                    : equipment.tier === "better"
                    ? "Two-Stage"
                    : "Single"}
                </p>
                <p className="text-sm text-muted-foreground">Compressor</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Volume2 className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xl font-bold text-foreground">
                  {equipment.tier === "best"
                    ? "Whisper"
                    : equipment.tier === "better"
                    ? "Ultra Quiet"
                    : "Standard"}
                </p>
                <p className="text-sm text-muted-foreground">Noise Level</p>
              </div>
            </div>

            {/* Features */}
            {equipment.features && equipment.features.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Included Features
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {equipment.features.map((feature, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-2 p-3 bg-success/5 rounded-lg payment-card-enter",
                        `stagger-${(index % 4) + 1}`
                      )}
                    >
                      <Check className="w-5 h-5 text-success shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="text-center pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">
                Complete Installed Price
              </p>
              <AnimatedPrice
                value={equipment.customerPrice}
                duration={1500}
                className="text-5xl font-heading font-bold text-primary"
              />
            </div>
          </div>
        </div>

        {/* Benefits callout */}
        <div className="grid sm:grid-cols-3 gap-4 slide-enter stagger-4">
          <div className="text-center p-4">
            <p className="text-2xl font-bold text-success mb-1">Up to 50%</p>
            <p className="text-sm text-muted-foreground">
              Energy savings vs old systems
            </p>
          </div>
          <div className="text-center p-4">
            <p className="text-2xl font-bold text-primary mb-1">10+ Years</p>
            <p className="text-sm text-muted-foreground">
              Expected lifespan
            </p>
          </div>
          <div className="text-center p-4">
            <p className="text-2xl font-bold text-accent-orange mb-1">Quiet</p>
            <p className="text-sm text-muted-foreground">
              Modern quiet operation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecommendedSystemSlide;
