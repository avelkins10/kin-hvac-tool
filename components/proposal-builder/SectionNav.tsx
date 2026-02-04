"use client";

import { cn } from "@/lib/utils";
import {
  UserCircle,
  Home,
  Wind,
  Heart,
  Package,
  Sparkles,
  Shield,
  Gift,
  CreditCard,
  ClipboardCheck,
  Settings,
  Check,
} from "lucide-react";
import {
  useProposalState,
  useActiveSection,
  useSectionProgress,
  type BuilderSection,
} from "./hooks/useProposalState";

interface SectionNavProps {
  onAdminAccess?: () => void;
}

interface NavItem {
  id: BuilderSection;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "customer",
    label: "Customer",
    icon: <UserCircle className="w-5 h-5" />,
    description: "Contact information",
  },
  {
    id: "property",
    label: "Property",
    icon: <Home className="w-5 h-5" />,
    description: "Home details",
  },
  {
    id: "current-system",
    label: "Current System",
    icon: <Wind className="w-5 h-5" />,
    description: "HVAC info & photo",
  },
  {
    id: "needs",
    label: "Needs Assessment",
    icon: <Heart className="w-5 h-5" />,
    description: "Preferences & priorities",
  },
  {
    id: "equipment",
    label: "System Design",
    icon: <Package className="w-5 h-5" />,
    description: "Equipment selection",
  },
  {
    id: "add-ons",
    label: "Add-Ons",
    icon: <Sparkles className="w-5 h-5" />,
    description: "Upgrades & enhancements",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: <Shield className="w-5 h-5" />,
    description: "Service plan",
  },
  {
    id: "incentives",
    label: "Incentives",
    icon: <Gift className="w-5 h-5" />,
    description: "Rebates & credits",
  },
  {
    id: "financing",
    label: "Financing",
    icon: <CreditCard className="w-5 h-5" />,
    description: "Payment options",
  },
  {
    id: "review",
    label: "Review",
    icon: <ClipboardCheck className="w-5 h-5" />,
    description: "Final summary",
  },
];

export function SectionNav({ onAdminAccess }: SectionNavProps) {
  const activeSection = useActiveSection();
  const sectionProgress = useSectionProgress();
  const { setActiveSection, getCompletionPercentage } = useProposalState();
  const completionPercent = getCompletionPercentage();

  return (
    <nav className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-heading font-bold text-sidebar-foreground">
          Proposal Builder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build your custom comfort solution
        </p>

        {/* Progress indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Progress
            </span>
            <span className="text-xs font-semibold text-primary">
              {completionPercent}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full progress-animate"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item, index) => {
            const isActive = activeSection === item.id;
            const isComplete = sectionProgress[item.id];

            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                    "group hover:bg-sidebar-accent",
                    isActive && "bg-primary/10 border border-primary/20",
                    !isActive && !isComplete && "opacity-70"
                  )}
                >
                  {/* Step number or check */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all",
                      isComplete
                        ? "bg-success text-white"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4 section-complete" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Label and description */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium text-sm truncate transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-sidebar-foreground group-hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      "shrink-0 transition-all",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                      isActive && "animate-wiggle"
                    )}
                  >
                    {item.icon}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer - Admin access */}
      {onAdminAccess && (
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={onAdminAccess}
            className={cn(
              "flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm",
              "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
              "transition-colors"
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Admin Settings</span>
          </button>
        </div>
      )}
    </nav>
  );
}

export default SectionNav;
