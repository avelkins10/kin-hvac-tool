"use client";

import { AlertCircle, ListChecks } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface FinanceStipulationsProps {
  stipulations: any[] | null;
  loading: boolean;
}

export function FinanceStipulations({
  stipulations,
  loading,
}: FinanceStipulationsProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium flex items-center gap-2">
        <ListChecks className="size-4" aria-hidden="true" />
        Stipulations
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Spinner className="size-4" aria-hidden="true" />
          Loading stipulations...
        </div>
      ) : Array.isArray(stipulations) && stipulations.length > 0 ? (
        <ul className="space-y-2">
          {stipulations.map((s: any, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <AlertCircle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>
                {typeof s === "object"
                  ? (s.description ?? s.type ?? s.name ?? JSON.stringify(s))
                  : String(s)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No stipulations or all cleared.
        </p>
      )}
    </div>
  );
}
