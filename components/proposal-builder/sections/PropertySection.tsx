"use client";

import { useCallback } from "react";
import { Home } from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import { FormField } from "../shared/FormField";
import {
  useProposalState,
  useProperty,
} from "../hooks/useProposalState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function PropertySection() {
  const property = useProperty();
  const { setProperty, markSectionComplete } = useProposalState();

  const handleNumberChange = useCallback(
    (field: keyof typeof property) => (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 0) {
        setProperty({ [field]: value });
      }
    },
    [setProperty]
  );

  const handleSelectChange = useCallback(
    (field: keyof typeof property) => (value: string) => {
      const numValue = parseInt(value, 10);
      setProperty({ [field]: numValue });
    },
    [setProperty]
  );

  const handleCheckboxChange = useCallback(
    (field: keyof typeof property) => (checked: boolean) => {
      setProperty({ [field]: checked });
    },
    [setProperty]
  );

  // Check if section is complete
  const isComplete = property.squareFootage > 0 && property.yearBuilt > 1800;

  if (isComplete) {
    markSectionComplete("property");
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Property Details"
        description="Tell us about the home"
        icon={<Home className="w-6 h-6" />}
      />

      <div className="space-y-6">
        {/* Square Footage and Year Built */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Square Footage"
            name="squareFootage"
            type="number"
            placeholder="2,500"
            value={property.squareFootage || ""}
            onChange={handleNumberChange("squareFootage")}
            required
            hint="Approximate living space"
          />
          <FormField
            label="Year Built"
            name="yearBuilt"
            type="number"
            placeholder="1995"
            value={property.yearBuilt || ""}
            onChange={handleNumberChange("yearBuilt")}
            required
          />
        </div>

        {/* Stories */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Number of Stories</Label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setProperty({ stories: num })}
                className={cn(
                  "px-4 py-3 rounded-xl font-medium transition-all",
                  "border-2 hover:border-primary/50",
                  property.stories === num
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground"
                )}
              >
                {num}{num === 4 ? "+" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Bedrooms and Bathrooms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bedrooms</Label>
            <Select
              value={property.bedrooms.toString()}
              onValueChange={handleSelectChange("bedrooms")}
            >
              <SelectTrigger className="rounded-xl h-auto py-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "bedroom" : "bedrooms"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Bathrooms</Label>
            <Select
              value={property.bathrooms.toString()}
              onValueChange={handleSelectChange("bathrooms")}
            >
              <SelectTrigger className="rounded-xl h-auto py-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "bathroom" : "bathrooms"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additions/Remodeling */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
          <div className="flex items-start gap-3">
            <Checkbox
              id="hasAdditions"
              checked={property.hasAdditionsOrRemodeling}
              onCheckedChange={handleCheckboxChange("hasAdditionsOrRemodeling")}
              className="mt-1"
            />
            <div>
              <Label
                htmlFor="hasAdditions"
                className="text-sm font-medium cursor-pointer"
              >
                Home has additions or remodeling
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Check if any rooms were added or major changes made
              </p>
            </div>
          </div>

          {property.hasAdditionsOrRemodeling && (
            <div className="flex items-start gap-3 ml-6 pt-2 border-t border-border animate-bounce-in">
              <Checkbox
                id="additionsDuctwork"
                checked={property.additionsHaveDuctwork}
                onCheckedChange={handleCheckboxChange("additionsHaveDuctwork")}
                className="mt-1"
              />
              <div>
                <Label
                  htmlFor="additionsDuctwork"
                  className="text-sm font-medium cursor-pointer"
                >
                  Additions have ductwork
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Does the existing HVAC system reach these areas?
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion indicator */}
      {isComplete && (
        <div className="flex items-center gap-2 p-4 bg-success-light rounded-xl text-success animate-bounce-in">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">Property details complete</span>
        </div>
      )}
    </div>
  );
}

export default PropertySection;
