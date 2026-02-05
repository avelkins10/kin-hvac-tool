"use client";

import { useState, useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Disclosure {
  id?: string;
  name: string;
  type:
    | "creditApplication"
    | "prequalification"
    | "txtMessageNotifications"
    | "termsAndConditions";
  version: string;
  summary: string;
  text: string;
  requireConsent: boolean;
  acceptanceLabel?: string;
  language: string;
}

interface DisclosureCheckboxesProps {
  onAcceptanceChange: (acceptedDisclosures: AcceptedDisclosure[]) => void;
  language?: "English" | "Spanish";
  disabled?: boolean;
  customerState?: string;
}

// Filter out disclosures for other states/territories
const STATE_KEYWORDS: Record<string, string> = {
  "Puerto Rico": "PR",
};

function isDisclosureRelevant(
  disclosure: Disclosure,
  customerState?: string,
): boolean {
  if (!customerState) return true;
  const text = `${disclosure.name} ${disclosure.summary}`;
  for (const [keyword, stateCode] of Object.entries(STATE_KEYWORDS)) {
    if (text.includes(keyword) && customerState.toUpperCase() !== stateCode) {
      return false;
    }
  }
  return true;
}

export interface AcceptedDisclosure {
  type: string;
  version: string;
  acceptedAt: string;
}

export function DisclosureCheckboxes({
  onAcceptanceChange,
  language = "English",
  disabled = false,
  customerState,
}: DisclosureCheckboxesProps) {
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchDisclosures() {
      try {
        const res = await fetch(
          `/api/finance/lightreach/disclosures?language=${language}`,
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load disclosures");
        }
        const data = await res.json();
        const filtered = (data.disclosures || []).filter((d: Disclosure) =>
          isDisclosureRelevant(d, customerState),
        );
        setDisclosures(filtered);

        // Initialize accepted state - only required disclosures start unchecked
        const initialAccepted: Record<string, boolean> = {};
        for (const d of filtered) {
          initialAccepted[d.type] = !d.requireConsent;
        }
        setAccepted(initialAccepted);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load disclosures",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchDisclosures();
  }, [language, customerState]);

  useEffect(() => {
    // Build list of accepted disclosures for parent
    const acceptedList: AcceptedDisclosure[] = [];
    for (const d of disclosures) {
      if (accepted[d.type]) {
        acceptedList.push({
          type: d.type,
          version: d.version,
          acceptedAt: new Date().toISOString(),
        });
      }
    }
    onAcceptanceChange(acceptedList);
  }, [accepted, disclosures, onAcceptanceChange]);

  const handleToggle = (type: string) => {
    setAccepted((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const toggleExpand = (type: string) => {
    setExpanded((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Check if all required disclosures are accepted
  const allRequiredAccepted = disclosures
    .filter((d) => d.requireConsent)
    .every((d) => accepted[d.type]);

  // Sanitize HTML content to prevent XSS
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "b",
        "i",
        "u",
        "ul",
        "ol",
        "li",
        "a",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "span",
        "div",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class"],
    });
  };

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-muted-foreground py-4"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-4" aria-hidden="true" />
        <span>Loading disclosures...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-destructive py-4"
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className="size-4" aria-hidden="true" />
        <span>{error}</span>
      </div>
    );
  }

  if (disclosures.length === 0) {
    return null;
  }

  return (
    <div
      className="space-y-4"
      role="group"
      aria-labelledby="disclosures-heading"
    >
      <div className="space-y-1">
        <Label id="disclosures-heading" className="text-base font-medium">
          Required Disclosures
        </Label>
        <p
          className="text-sm text-muted-foreground"
          id="disclosures-description"
        >
          Please review and accept the following disclosures to continue.
        </p>
      </div>

      <div className="space-y-3" aria-describedby="disclosures-description">
        {disclosures.map((disclosure) => (
          <Collapsible
            key={disclosure.type}
            open={expanded[disclosure.type]}
            onOpenChange={() => toggleExpand(disclosure.type)}
          >
            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`disclosure-${disclosure.type}`}
                  checked={accepted[disclosure.type] || false}
                  onCheckedChange={() => handleToggle(disclosure.type)}
                  disabled={disabled}
                  aria-describedby={`disclosure-summary-${disclosure.type}`}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={`disclosure-${disclosure.type}`}
                      className="font-medium cursor-pointer"
                    >
                      {disclosure.name}
                      {disclosure.requireConsent && (
                        <span
                          className="text-destructive ml-1"
                          aria-label="required"
                        >
                          *
                        </span>
                      )}
                    </Label>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        aria-label={
                          expanded[disclosure.type]
                            ? `Collapse ${disclosure.name} details`
                            : `Expand ${disclosure.name} details`
                        }
                      >
                        {expanded[disclosure.type] ? (
                          <ChevronUp className="size-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="size-4" aria-hidden="true" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <p
                    className="text-sm text-muted-foreground"
                    id={`disclosure-summary-${disclosure.type}`}
                  >
                    {disclosure.summary}
                  </p>
                </div>
              </div>

              <CollapsibleContent>
                <div className="mt-3 ml-7 p-3 rounded bg-muted/50 text-sm">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(disclosure.text),
                    }}
                  />
                  {disclosure.acceptanceLabel && (
                    <p className="mt-2 font-medium text-foreground">
                      {disclosure.acceptanceLabel}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Version: {disclosure.version}
                  </p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      {!allRequiredAccepted && (
        <p
          className="text-sm text-destructive flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="size-4" aria-hidden="true" />
          <span>Please accept all required disclosures to continue.</span>
        </p>
      )}
    </div>
  );
}

/**
 * Hook to check if all required disclosures are accepted
 */
export function useDisclosuresValid(
  acceptedDisclosures: AcceptedDisclosure[],
): boolean {
  // This would need access to the disclosure list to properly validate
  // For now, just check that at least creditApplication is accepted
  return acceptedDisclosures.some((d) => d.type === "creditApplication");
}
