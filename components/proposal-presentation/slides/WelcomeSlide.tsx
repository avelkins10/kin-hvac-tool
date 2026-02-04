"use client";

import { Home, Sparkles } from "lucide-react";
import {
  useCustomer,
  useProperty,
} from "../../proposal-builder/hooks/useProposalState";

export function WelcomeSlide() {
  const customer = useCustomer();
  const property = useProperty();

  const firstName = customer.name.split(" ")[0] || "Homeowner";

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 py-16 text-center">
      {/* Welcome icon */}
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8 animate-bounce-in">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>

      {/* Welcome message */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-4 slide-enter">
        Welcome, {firstName}!
      </h1>

      <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 slide-enter stagger-2">
        Let's explore your personalized comfort solution
      </p>

      {/* Property card */}
      {property.squareFootage > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-warm-lg slide-enter stagger-3">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Your Home</p>
              <p className="font-semibold text-foreground">
                {customer.address || "Property"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-2xl font-bold font-price text-foreground">
                {property.squareFootage.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">sq ft</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-2xl font-bold font-price text-foreground">
                {property.stories}
              </p>
              <p className="text-xs text-muted-foreground">
                {property.stories === 1 ? "story" : "stories"}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-2xl font-bold font-price text-foreground">
                {property.yearBuilt}
              </p>
              <p className="text-xs text-muted-foreground">built</p>
            </div>
          </div>
        </div>
      )}

      {/* Tagline */}
      <p className="mt-12 text-lg text-primary font-medium slide-enter stagger-4">
        Your Custom Comfort Solution
      </p>
    </div>
  );
}

export default WelcomeSlide;
