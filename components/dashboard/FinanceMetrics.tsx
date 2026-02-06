import Link from "next/link";
import { cn } from "@/lib/utils";
import { DollarSign, AlertCircle, CheckCircle2, FileText } from "lucide-react";

interface FinanceMetricsProps {
  active: number;
  conditional: number;
  approved: number;
  contractsPending: number;
}

const metrics = [
  {
    key: "active" as const,
    label: "Active Applications",
    icon: FileText,
    bg: "bg-primary-50",
    border: "border-primary-100",
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
  },
  {
    key: "conditional" as const,
    label: "Needs Action",
    icon: AlertCircle,
    bg: "bg-warning-light",
    border: "border-warning/20",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  {
    key: "approved" as const,
    label: "Approved",
    icon: CheckCircle2,
    bg: "bg-success-light",
    border: "border-success/20",
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  {
    key: "contractsPending" as const,
    label: "Contracts Pending",
    icon: DollarSign,
    bg: "bg-gray-50",
    border: "border-gray-100",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
  },
];

export function FinanceMetrics(props: FinanceMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        const value = props[m.key];
        return (
          <Link key={m.key} href="/operations/finance">
            <div
              className={cn(
                "p-5 rounded-lg border transition-all duration-150 cursor-pointer group card-hover hover:shadow-soft-md",
                m.bg,
                m.border,
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {m.label}
                </span>
                <div className={cn("p-2 rounded-md", m.iconBg)}>
                  <Icon className={cn("w-4 h-4", m.iconColor)} />
                </div>
              </div>
              <div className="text-3xl font-semibold text-foreground">
                {value}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
