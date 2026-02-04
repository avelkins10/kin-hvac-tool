"use client";

import { Sparkles, Check, Wind, Shield, Brain, Zap } from "lucide-react";
import { useAddOns } from "../../proposal-builder/hooks/useProposalState";
import { AnimatedPrice } from "../../proposal-builder/shared/AnimatedPrice";
import { cn } from "@/lib/utils";

const ADDON_ICONS: Record<string, React.ReactNode> = {
  default: <Sparkles className="w-6 h-6" />,
  air: <Wind className="w-6 h-6" />,
  uv: <Wind className="w-6 h-6" />,
  hepa: <Wind className="w-6 h-6" />,
  warranty: <Shield className="w-6 h-6" />,
  surge: <Shield className="w-6 h-6" />,
  smart: <Brain className="w-6 h-6" />,
  thermostat: <Brain className="w-6 h-6" />,
  duct: <Zap className="w-6 h-6" />,
};

function getIconForAddon(name: string) {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(ADDON_ICONS)) {
    if (key !== "default" && lowerName.includes(key)) {
      return icon;
    }
  }
  return ADDON_ICONS.default;
}

export function EnhancementsSlide() {
  const addOns = useAddOns();
  const selectedAddOns = addOns.filter((a) => a.selected);
  const totalPrice = selectedAddOns.reduce((sum, a) => sum + a.customerPrice, 0);

  if (selectedAddOns.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-full px-8 py-16">
        <div className="text-center">
          <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">
            No Enhancements Selected
          </h2>
          <p className="text-muted-foreground max-w-md">
            Your core system is already great! You can always add enhancements
            later if needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 slide-enter">
            System Enhancements
          </h2>
          <p className="text-lg text-muted-foreground slide-enter stagger-2">
            Premium upgrades included in your package
          </p>
        </div>

        {/* Add-ons grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {selectedAddOns.map((addon, index) => {
            const icon = getIconForAddon(addon.name);

            return (
              <div
                key={addon.id}
                className={cn(
                  "bg-card border border-border rounded-2xl p-5 shadow-warm payment-card-enter",
                  `stagger-${(index % 6) + 1}`
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {addon.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {addon.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5 text-success">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Included</span>
                  </div>
                  <AnimatedPrice
                    value={addon.customerPrice}
                    className="font-bold text-foreground"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center slide-enter stagger-4">
          <p className="text-sm text-muted-foreground mb-2">
            Total Enhancement Value
          </p>
          <AnimatedPrice
            value={totalPrice}
            className="text-4xl font-heading font-bold text-primary"
          />
        </div>
      </div>
    </div>
  );
}

export default EnhancementsSlide;
