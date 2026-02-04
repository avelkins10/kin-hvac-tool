import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Send,
  Eye,
  Users,
  UserCog,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconName = "FileText" | "Send" | "Eye" | "Users" | "UserCog" | "Workflow";

const iconMap = {
  FileText,
  Send,
  Eye,
  Users,
  UserCog,
  Workflow,
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: IconName;
  trend?: { value: number; label: string };
  accentColor: "blue" | "gray" | "amber" | "green" | "red";
  href?: string;
  subtitle?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  accentColor,
  href,
  subtitle,
}: MetricCardProps) {
  const Icon = iconMap[icon];

  const colorConfig = {
    blue: {
      bg: "bg-primary-50",
      border: "border-primary-100",
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      accent: "text-primary-600",
    },
    gray: {
      bg: "bg-gray-50",
      border: "border-gray-100",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-500",
      accent: "text-gray-500",
    },
    amber: {
      bg: "bg-warning-light",
      border: "border-warning/20",
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      accent: "text-warning",
    },
    green: {
      bg: "bg-success-light",
      border: "border-success/20",
      iconBg: "bg-success/10",
      iconColor: "text-success",
      accent: "text-success",
    },
    red: {
      bg: "bg-error-light",
      border: "border-error/20",
      iconBg: "bg-error/10",
      iconColor: "text-error",
      accent: "text-error",
    },
  };

  const colors = colorConfig[accentColor];

  const content = (
    <div
      className={cn(
        "p-5 rounded-lg border transition-all duration-150 cursor-pointer group card-hover",
        colors.bg,
        colors.border,
        "hover:shadow-soft-md",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        <div className={cn("p-2 rounded-md", colors.iconBg)}>
          <Icon className={cn("w-4 h-4", colors.iconColor)} />
        </div>
      </div>

      <div className="text-3xl font-semibold text-foreground mb-1">{value}</div>

      {trend && (
        <div className="flex items-center gap-1.5 text-sm">
          {trend.value >= 0 ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-error" />
          )}
          <span
            className={
              trend.value >= 0
                ? "text-success font-medium"
                : "text-error font-medium"
            }
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}

      {subtitle && (
        <div className={cn("text-sm mt-1", colors.accent)}>{subtitle}</div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
