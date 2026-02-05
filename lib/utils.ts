import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Proposal customerData is JSON; normalize for display (name + email) */
export function getProposalCustomerDisplay(customerData: unknown): {
  name: string;
  email: string;
} {
  if (customerData == null || typeof customerData !== "object") {
    return { name: "Unnamed Customer", email: "" };
  }
  const d = customerData as Record<string, unknown>;
  const name =
    typeof d.name === "string" && d.name.trim()
      ? d.name.trim()
      : [d.firstName, d.lastName].filter(Boolean).join(" ").trim() ||
        "Unnamed Customer";
  const email = typeof d.email === "string" ? d.email.trim() : "";
  return { name: name || "Unnamed Customer", email };
}
