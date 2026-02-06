"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface FinancePaymentScheduleProps {
  applicationId: string;
}

interface PaymentScheduleData {
  paymentSchedule: {
    monthlyPayments?: Array<{
      year: number;
      monthlyAmount: number;
    }>;
    escalationRate?: number;
    productName?: string;
    termYears?: number;
  };
  cached: boolean;
}

export function FinancePaymentSchedule({
  applicationId,
}: FinancePaymentScheduleProps) {
  const [data, setData] = useState<PaymentScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    if (data) return; // Already loaded

    setLoading(true);
    setError(null);

    fetch(`/api/finance/lightreach/payment-schedule/${applicationId}`, {
      credentials: "same-origin",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load payment schedule");
        return res.json();
      })
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        setError(err.message || "Failed to load payment schedule");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [applicationId, expanded, data]);

  const schedule = data?.paymentSchedule;
  const payments = schedule?.monthlyPayments || [];

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start p-0 h-auto font-medium text-sm hover:bg-transparent"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="size-4 mr-2" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-4 mr-2" aria-hidden="true" />
        )}
        <Calendar className="size-4 mr-2" aria-hidden="true" />
        Payment Schedule
      </Button>

      {expanded && (
        <div className="space-y-3">
          {loading ? (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
            >
              <Spinner className="size-4" aria-hidden="true" />
              Loading payment schedule...
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : schedule ? (
            <>
              {/* Product info */}
              {(schedule.productName || schedule.escalationRate != null) && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  {schedule.productName && (
                    <span>Product: {schedule.productName}</span>
                  )}
                  {schedule.escalationRate != null && (
                    <span>
                      Escalation: {schedule.escalationRate}%/year
                    </span>
                  )}
                  {schedule.termYears != null && (
                    <span>Term: {schedule.termYears} years</span>
                  )}
                </div>
              )}

              {/* Payment table */}
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-muted-foreground">
                          Year
                        </th>
                        <th className="text-right p-2 font-medium text-muted-foreground">
                          Monthly Payment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr
                          key={p.year}
                          className="border-b last:border-b-0"
                        >
                          <td className="p-2">Year {p.year}</td>
                          <td className="p-2 text-right font-medium">
                            {formatCurrency(p.monthlyAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment details available.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No payment schedule available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
