"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  DisclosureCheckboxes,
  AcceptedDisclosure,
} from "./DisclosureCheckboxes";
import { cn } from "@/lib/utils";

// Co-borrower relationship types
type CoBorrowerRelationship = "spouse" | "co-owner" | "other";

interface CoBorrowerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: CoBorrowerRelationship | "";
}

interface FinanceApplicationFormProps {
  proposalId: string;
  systemPrice: number;
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  onSuccess?: (applicationId: string) => void;
  onCancel?: () => void;
  showDisclosures?: boolean;
  allowCoBorrower?: boolean;
}

export function FinanceApplicationForm({
  proposalId,
  systemPrice,
  initialData,
  onSuccess,
  onCancel,
  showDisclosures = true,
  allowCoBorrower = true,
}: FinanceApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    zip: initialData?.zip || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptedDisclosures, setAcceptedDisclosures] = useState<
    AcceptedDisclosure[]
  >([]);

  // Co-borrower state
  const [showCoBorrower, setShowCoBorrower] = useState(false);
  const [coBorrowerData, setCoBorrowerData] = useState<CoBorrowerData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    relationship: "",
  });

  const handleDisclosureChange = useCallback(
    (disclosures: AcceptedDisclosure[]) => {
      setAcceptedDisclosures(disclosures);
    },
    [],
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone format";
    } else {
      const digitsOnly = formData.phone.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        newErrors.phone = "Phone number must be at least 10 digits";
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    } else if (formData.state.length !== 2) {
      newErrors.state = "State must be a 2-letter code (e.g., CA, NY)";
    }

    if (!formData.zip.trim()) {
      newErrors.zip = "ZIP code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      newErrors.zip =
        "ZIP code must be 5 digits or 9 digits (12345 or 12345-6789)";
    }

    // Co-borrower validation (only if co-borrower section is shown and has data)
    if (showCoBorrower) {
      const hasCoBorrowerData =
        coBorrowerData.firstName.trim() ||
        coBorrowerData.lastName.trim() ||
        coBorrowerData.email.trim() ||
        coBorrowerData.phone.trim();

      if (hasCoBorrowerData) {
        if (!coBorrowerData.firstName.trim()) {
          newErrors.coBorrowerFirstName = "Co-borrower first name is required";
        }
        if (!coBorrowerData.lastName.trim()) {
          newErrors.coBorrowerLastName = "Co-borrower last name is required";
        }
        if (!coBorrowerData.email.trim()) {
          newErrors.coBorrowerEmail = "Co-borrower email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coBorrowerData.email)) {
          newErrors.coBorrowerEmail = "Invalid email format";
        }
        if (!coBorrowerData.phone.trim()) {
          newErrors.coBorrowerPhone = "Co-borrower phone is required";
        } else {
          const digitsOnly = coBorrowerData.phone.replace(/\D/g, "");
          if (digitsOnly.length < 10) {
            newErrors.coBorrowerPhone = "Phone must be at least 10 digits";
          }
        }
        if (!coBorrowerData.relationship) {
          newErrors.coBorrowerRelationship = "Relationship is required";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build co-borrower data if present
      const hasCoBorrower =
        showCoBorrower &&
        coBorrowerData.firstName.trim() &&
        coBorrowerData.lastName.trim();

      const response = await fetch("/api/finance/lightreach/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposalId,
          applicationData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            systemPrice,
            // Include accepted disclosures for compliance tracking
            disclosures: acceptedDisclosures.map((d) => ({
              type: d.type,
              version: d.version,
            })),
            // Include co-borrower if provided
            ...(hasCoBorrower && {
              coBorrower: {
                firstName: coBorrowerData.firstName,
                lastName: coBorrowerData.lastName,
                email: coBorrowerData.email,
                phone: coBorrowerData.phone,
                relationship: coBorrowerData.relationship,
              },
            }),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit finance application");
      }

      toast.success("Finance application submitted successfully!");
      onSuccess?.(data.id);
    } catch (error) {
      console.error("Error submitting finance application:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit finance application. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCoBorrowerChange = (
    field: keyof CoBorrowerData,
    value: string,
  ) => {
    setCoBorrowerData((prev) => ({ ...prev, [field]: value }));
    // Clear co-borrower error for this field
    const errorKey = `coBorrower${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const toggleCoBorrower = () => {
    setShowCoBorrower((prev) => !prev);
    // Clear co-borrower data when hiding
    if (showCoBorrower) {
      setCoBorrowerData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        relationship: "",
      });
      // Clear any co-borrower errors
      setErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (key.startsWith("coBorrower")) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finance Application</CardTitle>
        <CardDescription>
          Submit your finance application for this proposal. System price: $
          {systemPrice.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                aria-invalid={!!errors.firstName}
                disabled={isSubmitting}
                required
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                aria-invalid={!!errors.lastName}
                disabled={isSubmitting}
                required
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={!!errors.email}
              disabled={isSubmitting}
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              aria-invalid={!!errors.phone}
              disabled={isSubmitting}
              required
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              aria-invalid={!!errors.address}
              disabled={isSubmitting}
              required
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                aria-invalid={!!errors.city}
                disabled={isSubmitting}
                required
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) =>
                  handleChange("state", e.target.value.toUpperCase())
                }
                aria-invalid={!!errors.state}
                disabled={isSubmitting}
                maxLength={2}
                placeholder="CA"
                required
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">
                ZIP Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleChange("zip", e.target.value)}
                aria-invalid={!!errors.zip}
                disabled={isSubmitting}
                placeholder="12345"
                required
              />
              {errors.zip && (
                <p className="text-sm text-destructive">{errors.zip}</p>
              )}
            </div>
          </div>

          {/* Co-Borrower Section */}
          {allowCoBorrower && (
            <div className="pt-4 border-t">
              <button
                type="button"
                onClick={toggleCoBorrower}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                disabled={isSubmitting}
              >
                <UserPlus className="w-4 h-4" />
                {showCoBorrower ? "Remove Co-Borrower" : "Add Co-Borrower"}
                {showCoBorrower ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  showCoBorrower ? "max-h-[500px] mt-4" : "max-h-0",
                )}
              >
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Adding a co-borrower may improve approval odds for larger
                    amounts.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coBorrowerFirstName">First Name</Label>
                      <Input
                        id="coBorrowerFirstName"
                        value={coBorrowerData.firstName}
                        onChange={(e) =>
                          handleCoBorrowerChange("firstName", e.target.value)
                        }
                        aria-invalid={!!errors.coBorrowerFirstName}
                        disabled={isSubmitting}
                      />
                      {errors.coBorrowerFirstName && (
                        <p className="text-sm text-destructive">
                          {errors.coBorrowerFirstName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coBorrowerLastName">Last Name</Label>
                      <Input
                        id="coBorrowerLastName"
                        value={coBorrowerData.lastName}
                        onChange={(e) =>
                          handleCoBorrowerChange("lastName", e.target.value)
                        }
                        aria-invalid={!!errors.coBorrowerLastName}
                        disabled={isSubmitting}
                      />
                      {errors.coBorrowerLastName && (
                        <p className="text-sm text-destructive">
                          {errors.coBorrowerLastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coBorrowerEmail">Email</Label>
                    <Input
                      id="coBorrowerEmail"
                      type="email"
                      value={coBorrowerData.email}
                      onChange={(e) =>
                        handleCoBorrowerChange("email", e.target.value)
                      }
                      aria-invalid={!!errors.coBorrowerEmail}
                      disabled={isSubmitting}
                    />
                    {errors.coBorrowerEmail && (
                      <p className="text-sm text-destructive">
                        {errors.coBorrowerEmail}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coBorrowerPhone">Phone</Label>
                      <Input
                        id="coBorrowerPhone"
                        type="tel"
                        value={coBorrowerData.phone}
                        onChange={(e) =>
                          handleCoBorrowerChange("phone", e.target.value)
                        }
                        aria-invalid={!!errors.coBorrowerPhone}
                        disabled={isSubmitting}
                      />
                      {errors.coBorrowerPhone && (
                        <p className="text-sm text-destructive">
                          {errors.coBorrowerPhone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coBorrowerRelationship">
                        Relationship
                      </Label>
                      <Select
                        value={coBorrowerData.relationship}
                        onValueChange={(value) =>
                          handleCoBorrowerChange(
                            "relationship",
                            value as CoBorrowerRelationship,
                          )
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger
                          id="coBorrowerRelationship"
                          aria-invalid={!!errors.coBorrowerRelationship}
                        >
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="co-owner">
                            Co-Owner / Partner
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.coBorrowerRelationship && (
                        <p className="text-sm text-destructive">
                          {errors.coBorrowerRelationship}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Credit Application Disclosures */}
          {showDisclosures && (
            <div className="pt-4 border-t">
              <DisclosureCheckboxes
                onAcceptanceChange={handleDisclosureChange}
                language="English"
                disabled={isSubmitting}
                customerState={formData.state}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (showDisclosures &&
                  !acceptedDisclosures.some(
                    (d) => d.type === "creditApplication",
                  ))
              }
            >
              {isSubmitting && <Spinner className="mr-2" />}
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
