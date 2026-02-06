"use client";

import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  Package,
} from "lucide-react";

interface FinanceStatCardsProps {
  total: number;
  pending: number;
  conditional: number;
  approved: number;
  contractsSent: number;
  installSubmitted: number;
}

const stats = [
  {
    key: "total" as const,
    label: "Total Applications",
    icon: FileText,
    color: "bg-primary-50 border-primary-100",
    iconColor: "bg-primary-100 text-primary-600",
  },
  {
    key: "pending" as const,
    label: "Pending Review",
    icon: Clock,
    color: "bg-gray-50 border-gray-100",
    iconColor: "bg-gray-100 text-gray-500",
  },
  {
    key: "conditional" as const,
    label: "Needs Action",
    icon: AlertCircle,
    color: "bg-warning-light border-warning/20",
    iconColor: "bg-warning/10 text-warning",
  },
  {
    key: "approved" as const,
    label: "Approved",
    icon: CheckCircle2,
    color: "bg-success-light border-success/20",
    iconColor: "bg-success/10 text-success",
  },
  {
    key: "contractsSent" as const,
    label: "Contracts Sent",
    icon: Send,
    color: "bg-primary-50 border-primary-100",
    iconColor: "bg-primary-100 text-primary-600",
  },
  {
    key: "installSubmitted" as const,
    label: "Installs Submitted",
    icon: Package,
    color: "bg-success-light border-success/20",
    iconColor: "bg-success/10 text-success",
  },
];

export function FinanceStatCards(props: FinanceStatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const value = props[stat.key];
        return (
          <div
            key={stat.key}
            className={cn(
              "p-4 rounded-lg border transition-all",
              stat.color,
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </span>
              <div className={cn("p-1.5 rounded-md", stat.iconColor)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
