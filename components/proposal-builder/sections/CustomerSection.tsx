"use client";

import { useCallback, useEffect } from "react";
import { UserCircle } from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import { FormField } from "../shared/FormField";
import { useProposalState, useCustomer } from "../hooks/useProposalState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export function CustomerSection() {
  const customer = useCustomer();
  const { setCustomer, markSectionComplete } = useProposalState();

  const handleChange = useCallback(
    (field: keyof typeof customer) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomer({ [field]: e.target.value });
      },
    [setCustomer],
  );

  const handleStateChange = useCallback(
    (value: string) => {
      setCustomer({ state: value });
    },
    [setCustomer],
  );

  // Check if section is complete
  const isComplete =
    customer.name.trim() !== "" &&
    customer.email.trim() !== "" &&
    customer.phone.trim() !== "" &&
    customer.address.trim() !== "" &&
    customer.city.trim() !== "" &&
    customer.state !== "" &&
    customer.zip.trim() !== "";

  // Mark section complete when all required fields are filled (in useEffect to avoid render loop)
  useEffect(() => {
    if (isComplete) {
      markSectionComplete("customer");
    }
  }, [isComplete, markSectionComplete]);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Customer Information"
        description="Enter the homeowner's contact details"
        icon={<UserCircle className="w-6 h-6" />}
      />

      <div className="space-y-6">
        {/* Full Name */}
        <FormField
          label="Full Name"
          name="name"
          type="text"
          placeholder="John Smith"
          value={customer.name}
          onChange={handleChange("name")}
          required
        />

        {/* Email and Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="john@example.com"
            value={customer.email}
            onChange={handleChange("email")}
            required
          />
          <FormField
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={customer.phone}
            onChange={handleChange("phone")}
            required
          />
        </div>

        {/* Address */}
        <FormField
          label="Street Address"
          name="address"
          type="text"
          placeholder="123 Main Street"
          value={customer.address}
          onChange={handleChange("address")}
          required
        />

        {/* City, State, ZIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2">
            <FormField
              label="City"
              name="city"
              type="text"
              placeholder="Charleston"
              value={customer.city}
              onChange={handleChange("city")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              State <span className="text-destructive">*</span>
            </Label>
            <Select value={customer.state} onValueChange={handleStateChange}>
              <SelectTrigger className="rounded-xl h-auto py-3">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FormField
            label="ZIP Code"
            name="zip"
            type="text"
            placeholder="29401"
            value={customer.zip}
            onChange={handleChange("zip")}
            required
          />
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
          <span className="font-medium">Customer information complete</span>
        </div>
      )}
    </div>
  );
}

export default CustomerSection;
