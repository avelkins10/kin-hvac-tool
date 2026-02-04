"use client";

import { useMemo } from "react";
import {
  Sparkles,
  Check,
  Wind,
  Brain,
  Shield,
  Zap,
  Thermometer,
  Volume2,
} from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import { AnimatedPrice } from "../shared/AnimatedPrice";
import {
  useProposalState,
  useAddOns,
} from "../hooks/useProposalState";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "air-quality": <Wind className="w-5 h-5" />,
  "smart-home": <Brain className="w-5 h-5" />,
  protection: <Shield className="w-5 h-5" />,
  efficiency: <Zap className="w-5 h-5" />,
};

const ADD_ON_ICONS: Record<string, React.ReactNode> = {
  "UV Light Air Purifier": <Wind className="w-5 h-5" />,
  "HEPA Filtration System": <Wind className="w-5 h-5" />,
  "Premium Smart Thermostat": <Thermometer className="w-5 h-5" />,
  "Extended Warranty": <Shield className="w-5 h-5" />,
  "Duct Sealing Package": <Zap className="w-5 h-5" />,
  "Surge Protector": <Shield className="w-5 h-5" />,
  "Smart Thermostat": <Thermometer className="w-5 h-5" />,
  "Zoning System": <Thermometer className="w-5 h-5" />,
};

export function AddOnsSection() {
  const addOns = useAddOns();
  const { toggleAddOn, markSectionComplete } = useProposalState();

  // Calculate totals
  const selectedAddOns = addOns.filter((a) => a.selected);
  const totalAddOnsPrice = selectedAddOns.reduce(
    (sum, a) => sum + a.customerPrice,
    0
  );

  // Group add-ons by category
  const groupedAddOns = useMemo(() => {
    const groups: Record<string, typeof addOns> = {
      "air-quality": [],
      "smart-home": [],
      protection: [],
      efficiency: [],
    };

    addOns.forEach((addon) => {
      // Categorize based on name/keywords
      if (
        addon.name.toLowerCase().includes("air") ||
        addon.name.toLowerCase().includes("uv") ||
        addon.name.toLowerCase().includes("hepa") ||
        addon.name.toLowerCase().includes("filter")
      ) {
        groups["air-quality"].push(addon);
      } else if (
        addon.name.toLowerCase().includes("smart") ||
        addon.name.toLowerCase().includes("thermostat") ||
        addon.name.toLowerCase().includes("wifi")
      ) {
        groups["smart-home"].push(addon);
      } else if (
        addon.name.toLowerCase().includes("warranty") ||
        addon.name.toLowerCase().includes("surge") ||
        addon.name.toLowerCase().includes("protection")
      ) {
        groups.protection.push(addon);
      } else {
        groups.efficiency.push(addon);
      }
    });

    return groups;
  }, [addOns]);

  // Mark section as viewable once visited (add-ons are optional)
  const handleComplete = () => {
    markSectionComplete("add-ons");
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Enhancements & Add-Ons"
        description="Customize your system with these upgrades"
        icon={<Sparkles className="w-6 h-6" />}
      />

      {addOns.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-2xl">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No add-ons available. Continue to the next section.
          </p>
          <button
            onClick={handleComplete}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Add-ons grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addOns.map((addon, index) => {
              const isSelected = addon.selected;
              const icon =
                ADD_ON_ICONS[addon.name] || <Sparkles className="w-5 h-5" />;

              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddOn(addon.id)}
                  className={cn(
                    "relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all",
                    "hover:shadow-warm card-hover payment-card-enter",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30",
                    `stagger-${(index % 6) + 1}`
                  )}
                >
                  {/* Selection indicator */}
                  <div
                    className={cn(
                      "absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary-foreground animate-checkmark" />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-foreground pr-8">
                    {addon.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 flex-1">
                    {addon.description}
                  </p>

                  {/* Price */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <AnimatedPrice
                      value={addon.customerPrice}
                      className={cn(
                        "text-lg font-bold",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Summary */}
          <div
            className={cn(
              "p-4 rounded-xl transition-all",
              selectedAddOns.length > 0
                ? "bg-primary/10 border border-primary/20"
                : "bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {selectedAddOns.length} add-on
                  {selectedAddOns.length !== 1 ? "s" : ""} selected
                </p>
                {selectedAddOns.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedAddOns.map((a) => a.name).join(", ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <AnimatedPrice
                  value={totalAddOnsPrice}
                  className="text-xl font-bold text-foreground"
                />
                <p className="text-xs text-muted-foreground">Add-ons total</p>
              </div>
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={handleComplete}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 active:scale-[0.99] transition-all"
          >
            Continue to Maintenance Plans
          </button>
        </div>
      )}
    </div>
  );
}

export default AddOnsSection;
