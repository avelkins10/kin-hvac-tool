"use client";

import { CheckCircle, Clock, Flag } from "lucide-react";

interface FinanceMilestonesProps {
  milestones?: any[];
  milestonePackages?: any[];
}

export function FinanceMilestones({
  milestones,
  milestonePackages,
}: FinanceMilestonesProps) {
  if (!milestones?.length && !milestonePackages?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium flex items-center gap-2">
        <Flag className="size-4" aria-hidden="true" />
        Milestones
      </p>
      <div className="space-y-2">
        {milestones?.map((m: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <CheckCircle className="size-4 text-green-600" aria-hidden="true" />
            <span>{m.milestone ?? m}</span>
            {m.at && (
              <span className="text-muted-foreground text-xs">
                {new Date(m.at).toLocaleString()}
              </span>
            )}
          </div>
        ))}
        {milestonePackages?.map((p: any, i: number) => (
          <div key={`pkg-${i}`} className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>
              {p.type ?? "Package"}: {p.status ?? "—"}
            </span>
            {p.at && (
              <span className="text-muted-foreground text-xs">
                {new Date(p.at).toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
