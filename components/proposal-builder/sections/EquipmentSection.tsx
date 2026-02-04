"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Package, Check, Sparkles, Star, Zap } from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import { AnimatedPrice } from "../shared/AnimatedPrice";
import {
  useProposalState,
  useSelectedEquipment,
  type Equipment,
} from "../hooks/useProposalState";
import { usePriceBook } from "@/src/contexts/PriceBookContext";
import { cn } from "@/lib/utils";

const TIER_ICONS = {
  good: <Star className="w-5 h-5" />,
  better: <Sparkles className="w-5 h-5" />,
  best: <Zap className="w-5 h-5" />,
};

const TIER_LABELS = {
  good: "Essential",
  better: "Premium",
  best: "Ultimate",
};

const TIER_COLORS = {
  good: "from-gray-500 to-gray-600",
  better: "from-primary-500 to-primary-600",
  best: "from-accent-orange to-accent-orange-dark",
};

export function EquipmentSection() {
  const selectedEquipment = useSelectedEquipment();
  const { setSelectedEquipment, markSectionComplete, setAddOns } = useProposalState();
  const {
    priceBook,
    loading,
    getSystemSalesPrice,
    getCustomerPrice,
    getAddOnSalesPrice,
  } = usePriceBook();

  // Transform price book systems to Equipment format
  const equipmentOptions: Equipment[] = useMemo(() => {
    if (!priceBook?.hvacSystems) return [];

    return priceBook.hvacSystems
      .filter((system) => system.enabled)
      .map((system) => {
        const salesPrice = getSystemSalesPrice(system);
        const customerPrice = getCustomerPrice(salesPrice);

        return {
          id: system.id,
          tier: system.tier,
          name: system.name,
          description: system.description,
          salesPrice,
          customerPrice,
          baseCost: system.baseCost,
          seer: system.tier === "best" ? 20 : system.tier === "better" ? 18 : 16,
          features: system.features,
          recommended: system.tier === "better",
        };
      })
      .sort((a, b) => {
        const tierOrder = { good: 0, better: 1, best: 2 };
        return tierOrder[a.tier] - tierOrder[b.tier];
      });
  }, [priceBook?.hvacSystems, getSystemSalesPrice, getCustomerPrice]);

  // Initialize add-ons from price book
  useEffect(() => {
    if (priceBook?.addOns) {
      const addOns = priceBook.addOns
        .filter((addon) => addon.enabled)
        .map((addon) => {
          const salesPrice = getAddOnSalesPrice(addon);
          const customerPrice = getCustomerPrice(salesPrice);

          return {
            id: addon.id,
            name: addon.name,
            description: addon.description,
            price: salesPrice,
            customerPrice,
            category: "protection" as const,
            selected: false,
          };
        });
      setAddOns(addOns);
    }
  }, [priceBook?.addOns, getAddOnSalesPrice, getCustomerPrice, setAddOns]);

  const handleSelectEquipment = useCallback(
    (equipment: Equipment) => {
      setSelectedEquipment(equipment);
      markSectionComplete("equipment");
    },
    [setSelectedEquipment, markSectionComplete]
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <SectionHeader
          title="System Design"
          description="Choose the perfect system for your home"
          icon={<Package className="w-6 h-6" />}
        />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl shimmer"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="System Design"
        description="Choose the perfect system for your home"
        icon={<Package className="w-6 h-6" />}
      />

      <div className="space-y-6">
        {equipmentOptions.map((equipment, index) => {
          const isSelected = selectedEquipment?.id === equipment.id;
          const isRecommended = equipment.recommended;

          return (
            <button
              key={equipment.id}
              onClick={() => handleSelectEquipment(equipment)}
              className={cn(
                "relative w-full text-left rounded-2xl border-2 transition-all payment-card-enter",
                "hover:shadow-warm-lg card-hover overflow-hidden",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary glow-primary"
                  : isRecommended
                  ? "border-primary/50 pulse-subtle"
                  : "border-border hover:border-primary/30",
                `stagger-${index + 1}`
              )}
            >
              {/* Tier banner */}
              <div
                className={cn(
                  "px-6 py-3 bg-gradient-to-r text-white flex items-center justify-between",
                  TIER_COLORS[equipment.tier]
                )}
              >
                <div className="flex items-center gap-2">
                  {TIER_ICONS[equipment.tier]}
                  <span className="font-heading font-bold text-lg">
                    {TIER_LABELS[equipment.tier]}
                  </span>
                </div>
                {isRecommended && (
                  <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold badge-shine">
                    Recommended
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={cn("p-6", isSelected ? "bg-primary/5" : "bg-card")}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-heading font-bold text-foreground">
                      {equipment.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {equipment.description}
                    </p>

                    {/* Key stats */}
                    <div className="flex gap-4 mt-4">
                      <div className="px-3 py-1.5 bg-muted rounded-lg">
                        <span className="text-xs text-muted-foreground">SEER</span>
                        <p className="font-bold text-foreground">
                          {equipment.seer}
                        </p>
                      </div>
                      <div className="px-3 py-1.5 bg-muted rounded-lg">
                        <span className="text-xs text-muted-foreground">
                          Efficiency
                        </span>
                        <p className="font-bold text-foreground">
                          {equipment.tier === "best"
                            ? "Maximum"
                            : equipment.tier === "better"
                            ? "High"
                            : "Standard"}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    {equipment.features && equipment.features.length > 0 && (
                      <ul className="mt-4 space-y-1.5">
                        {equipment.features.slice(0, 5).map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <Check
                              className={cn(
                                "w-4 h-4 mt-0.5 shrink-0",
                                isSelected ? "text-primary" : "text-success"
                              )}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {equipment.features.length > 5 && (
                          <li className="text-xs text-primary">
                            +{equipment.features.length - 5} more features
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Price and selection */}
                  <div className="md:text-right shrink-0">
                    <AnimatedPrice
                      value={equipment.customerPrice}
                      className="text-3xl font-heading font-bold text-foreground"
                    />
                    <p className="text-sm text-muted-foreground">
                      Installed price
                    </p>

                    {/* Selection indicator */}
                    <div
                      className={cn(
                        "mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 animate-checkmark" />
                          <span className="font-semibold">Selected</span>
                        </>
                      ) : (
                        <span>Select this option</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection status */}
      {selectedEquipment && (
        <div className="flex items-center gap-2 p-4 bg-success-light rounded-xl text-success animate-bounce-in">
          <Check className="w-5 h-5" />
          <span className="font-medium">
            {selectedEquipment.name} selected - $
            {selectedEquipment.customerPrice.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

export default EquipmentSection;
