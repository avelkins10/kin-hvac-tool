"use client";

import { useCallback } from "react";
import { Heart, Leaf, Volume2, Brain, DollarSign, Clock, Users, Zap } from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import {
  useProposalState,
  useNeeds,
} from "../hooks/useProposalState";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  {
    value: "comfort",
    label: "Maximum Comfort",
    description: "Best temperature control & air quality",
    icon: <Heart className="w-5 h-5" />,
  },
  {
    value: "efficiency",
    label: "Energy Efficiency",
    description: "Lowest operating costs & eco-friendly",
    icon: <Leaf className="w-5 h-5" />,
  },
  {
    value: "budget",
    label: "Budget Friendly",
    description: "Best value for the investment",
    icon: <DollarSign className="w-5 h-5" />,
  },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "ASAP - Emergency" },
  { value: "1-2weeks", label: "Within 1-2 weeks" },
  { value: "1month", label: "Within a month" },
  { value: "3months", label: "Within 3 months" },
  { value: "planning", label: "Just planning ahead" },
];

const BUDGET_OPTIONS = [
  { value: "economy", label: "Economy ($8,000 - $12,000)" },
  { value: "standard", label: "Standard ($12,000 - $16,000)" },
  { value: "premium", label: "Premium ($16,000 - $22,000)" },
  { value: "luxury", label: "Luxury ($22,000+)" },
  { value: "unsure", label: "Not sure yet" },
];

const NOISE_OPTIONS = [
  { value: "whisper", label: "Whisper quiet is important" },
  { value: "normal", label: "Normal noise levels are fine" },
  { value: "notconcerned", label: "Not concerned about noise" },
];

const OCCUPANCY_OPTIONS = [
  { value: "always", label: "Someone always home" },
  { value: "workdays", label: "Empty during work hours" },
  { value: "varies", label: "Schedule varies" },
  { value: "rental", label: "Rental property" },
];

export function NeedsSection() {
  const needs = useNeeds();
  const { setNeeds, markSectionComplete } = useProposalState();

  const handlePriorityChange = useCallback(
    (priority: "comfort" | "efficiency" | "budget") => {
      setNeeds({ priority });
    },
    [setNeeds]
  );

  const handleSelectChange = useCallback(
    (field: keyof typeof needs) => (value: string) => {
      setNeeds({ [field]: value });
    },
    [setNeeds]
  );

  const handleCheckboxChange = useCallback(
    (field: keyof typeof needs) => (checked: boolean) => {
      setNeeds({ [field]: checked });
    },
    [setNeeds]
  );

  // Check if section is complete
  const isComplete = needs.priority && needs.timeline !== "";

  if (isComplete) {
    markSectionComplete("needs");
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Needs Assessment"
        description="Help us understand what matters most to you"
        icon={<Heart className="w-6 h-6" />}
      />

      <div className="space-y-8">
        {/* Top Priority */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">
            What's your top priority? <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRIORITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  handlePriorityChange(
                    option.value as "comfort" | "efficiency" | "budget"
                  )
                }
                className={cn(
                  "flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all",
                  "hover:border-primary/50 card-hover",
                  needs.priority === option.value
                    ? "border-primary bg-primary/5 glow-primary"
                    : "border-border bg-card"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    needs.priority === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {option.icon}
                </div>
                <div className="text-center">
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            When do you need the work done? <span className="text-destructive">*</span>
          </Label>
          <Select
            value={needs.timeline}
            onValueChange={handleSelectChange("timeline")}
          >
            <SelectTrigger className="rounded-xl h-auto py-3">
              <SelectValue placeholder="Select timeline" />
            </SelectTrigger>
            <SelectContent>
              {TIMELINE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Budget Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Budget Range</Label>
          <Select
            value={needs.budgetRange}
            onValueChange={handleSelectChange("budgetRange")}
          >
            <SelectTrigger className="rounded-xl h-auto py-3">
              <SelectValue placeholder="Select budget range" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Noise Tolerance */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Noise Sensitivity
          </Label>
          <Select
            value={needs.noiseTolerance}
            onValueChange={handleSelectChange("noiseTolerance")}
          >
            <SelectTrigger className="rounded-xl h-auto py-3">
              <SelectValue placeholder="Select noise preference" />
            </SelectTrigger>
            <SelectContent>
              {NOISE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Home Occupancy */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Home Occupancy
          </Label>
          <Select
            value={needs.homeOccupancy}
            onValueChange={handleSelectChange("homeOccupancy")}
          >
            <SelectTrigger className="rounded-xl h-auto py-3">
              <SelectValue placeholder="Select occupancy pattern" />
            </SelectTrigger>
            <SelectContent>
              {OCCUPANCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Feature Preferences */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Feature Preferences</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <Checkbox
                id="smartHome"
                checked={needs.smartHomeIntegration}
                onCheckedChange={handleCheckboxChange("smartHomeIntegration")}
                className="mt-0.5"
              />
              <div>
                <Label
                  htmlFor="smartHome"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <Brain className="w-4 h-4 text-primary" />
                  Smart Home Integration
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  WiFi control, voice assistants
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <Checkbox
                id="environmental"
                checked={needs.environmentalConcern}
                onCheckedChange={handleCheckboxChange("environmentalConcern")}
                className="mt-0.5"
              />
              <div>
                <Label
                  htmlFor="environmental"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <Leaf className="w-4 h-4 text-success" />
                  Eco-Friendly Priority
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Reduce carbon footprint
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <Checkbox
                id="allergies"
                checked={needs.allergies}
                onCheckedChange={handleCheckboxChange("allergies")}
                className="mt-0.5"
              />
              <div>
                <Label
                  htmlFor="allergies"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-warning" />
                  Allergy Concerns
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Advanced air filtration needed
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <Checkbox
                id="pets"
                checked={needs.pets}
                onCheckedChange={handleCheckboxChange("pets")}
                className="mt-0.5"
              />
              <div>
                <Label
                  htmlFor="pets"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  🐾 Pets in Home
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Extra filtration for pet hair/dander
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Financing Interest */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <Checkbox
            id="financing"
            checked={needs.financing}
            onCheckedChange={handleCheckboxChange("financing")}
            className="mt-0.5"
          />
          <div>
            <Label
              htmlFor="financing"
              className="text-sm font-medium cursor-pointer"
            >
              Interested in financing options
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              We offer $0 down options and monthly payment plans
            </p>
          </div>
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
          <span className="font-medium">Needs assessment complete</span>
        </div>
      )}
    </div>
  );
}

export default NeedsSection;
