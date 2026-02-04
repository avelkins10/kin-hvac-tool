"use client";

import type { ResponseData } from "./types";

interface FinanceStatusDetailsProps {
  responseData: ResponseData;
  lenderId: string;
}

export function FinanceStatusDetails({
  responseData,
  lenderId,
}: FinanceStatusDetailsProps) {
  if (!responseData.monthlyPayment) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Monthly Payment</p>
          <p className="text-2xl font-bold">
            ${responseData.monthlyPayment.toFixed(2)}
          </p>
        </div>
        {responseData.totalCost && (
          <div>
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold">
              ${responseData.totalCost.toFixed(2)}
            </p>
          </div>
        )}
      </div>
      {(responseData.term ||
        responseData.termYears ||
        responseData.escalatorRate !== undefined) && (
        <div className="mt-4 space-y-2">
          {lenderId === "lightreach" && responseData.leaseType ? (
            // Comfort Plan lease display
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Plan: </span>
                <span className="font-medium">{responseData.leaseType}</span>
              </div>
              {responseData.termYears && (
                <div>
                  <span className="text-muted-foreground">Term: </span>
                  <span className="font-medium">
                    {responseData.termYears} years (
                    {responseData.term || responseData.termYears * 12} months)
                  </span>
                </div>
              )}
              {responseData.escalatorRate !== undefined && (
                <div>
                  <span className="text-muted-foreground">Escalator: </span>
                  <span className="font-medium">
                    {responseData.escalatorRate === 0
                      ? "0% (Fixed payment)"
                      : `${responseData.escalatorRate}% annually`}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">APR: </span>
                <span className="font-medium">0% (Lease)</span>
              </div>
            </div>
          ) : (
            // Regular loan display
            <div className="flex gap-4 text-sm">
              {responseData.apr !== undefined && (
                <div>
                  <span className="text-muted-foreground">APR: </span>
                  <span className="font-medium">{responseData.apr}%</span>
                </div>
              )}
              {responseData.term && (
                <div>
                  <span className="text-muted-foreground">Term: </span>
                  <span className="font-medium">
                    {responseData.term} months
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
