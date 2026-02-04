import Link from "next/link";
import { ChevronRight, FileText, Users, UserCog, Workflow } from "lucide-react";

type IconName = "FileText" | "Users" | "UserCog" | "Workflow";

const iconMap = {
  FileText,
  Users,
  UserCog,
  Workflow,
};

interface NavCardProps {
  title: string;
  description: string;
  icon: IconName;
  count?: number;
  href: string;
}

export function NavCard({
  title,
  description,
  icon,
  count,
  href,
}: NavCardProps) {
  const Icon = iconMap[icon];
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-white rounded-lg border border-border
                 hover:border-primary-200 hover:bg-primary-50/30 transition-all group card-hover"
    >
      <div className="p-2.5 bg-gray-50 rounded-md group-hover:bg-primary-50 transition-colors">
        <Icon className="w-5 h-5 text-gray-500 group-hover:text-primary-600 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground truncate">
          {description}
        </div>
      </div>
      {count !== undefined && (
        <div className="text-xl font-semibold text-gray-300">{count}</div>
      )}
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
    </Link>
  );
}
