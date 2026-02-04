"use client";

import { cn } from "@/lib/utils";
import { Check, Sparkles } from "lucide-react";
import { AnimatedPrice } from "./AnimatedPrice";

interface PriceCardProps {
  title: string;
  subtitle?: string;
  price: number;
  priceLabel?: string;
  features?: string[];
  selected?: boolean;
  recommended?: boolean;
  badge?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function PriceCard({
  title,
  subtitle,
  price,
  priceLabel,
  features,
  selected = false,
  recommended = false,
  badge,
  onClick,
  className,
  children,
}: PriceCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full text-left p-6 rounded-2xl border-2 transition-all",
        "hover:shadow-warm-lg card-hover",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 glow-primary"
          : "border-border bg-card hover:border-primary/30",
        recommended && !selected && "border-primary/50 pulse-subtle",
        className
      )}
    >
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-primary text-white text-xs font-semibold rounded-full badge-shine flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Recommended</span>
        </div>
      )}

      {/* Custom badge */}
      {badge && !recommended && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-accent-orange text-white text-xs font-semibold rounded-full">
          {badge}
        </div>
      )}

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pop">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {/* Header */}
        <div className={cn(recommended && "pt-2")}>
          <h3 className="text-lg font-heading font-bold text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <div className="flex items-baseline gap-1">
            <AnimatedPrice
              value={price}
              className={cn(
                "text-3xl font-heading font-bold",
                selected ? "text-primary" : "text-foreground"
              )}
            />
            {priceLabel && (
              <span className="text-sm text-muted-foreground">
                {priceLabel}
              </span>
            )}
          </div>
        </div>

        {/* Features */}
        {features && features.length > 0 && (
          <ul className="space-y-2 pt-4 border-t border-border">
            {features.map((feature, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Check
                  className={cn(
                    "w-4 h-4 mt-0.5 shrink-0",
                    selected ? "text-primary" : "text-success"
                  )}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Custom content */}
        {children}
      </div>
    </button>
  );
}

export default PriceCard;
