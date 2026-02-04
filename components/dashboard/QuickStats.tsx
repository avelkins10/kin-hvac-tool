import { DollarSign, Clock, Trophy } from "lucide-react";

interface QuickStatsProps {
  avgValue: number;
  lastSentDaysAgo: number | null;
  winRate: number;
}

export function QuickStats({
  avgValue,
  lastSentDaysAgo,
  winRate,
}: QuickStatsProps) {
  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <h3 className="font-medium text-foreground mb-4">Quick Stats</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Average Value</span>
          </div>
          <span className="font-semibold">
            ${(avgValue || 0).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Last Sent</span>
          </div>
          <span className="font-semibold">
            {lastSentDaysAgo !== null ? `${lastSentDaysAgo} days ago` : "Never"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Win Rate</span>
          </div>
          <span
            className={`font-semibold ${winRate > 50 ? "text-success" : ""}`}
          >
            {winRate}%
          </span>
        </div>
      </div>
    </div>
  );
}
