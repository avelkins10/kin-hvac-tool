"use client";

import { CheckCircle, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import type { ContractStatus } from "./types";

interface FinanceContractSectionProps {
  contractStatus: ContractStatus;
}

export function FinanceContractSection({
  contractStatus,
}: FinanceContractSectionProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium mb-3">Contract Status</p>
      <div className="space-y-2">
        {/* Contract Sent */}
        <div className="flex items-center gap-2">
          {contractStatus.sent ? (
            <>
              <CheckCircle className="size-4 text-green-600" aria-hidden="true" />
              <span className="text-sm">
                Contract sent to customer
                {contractStatus.sentAt && (
                  <span className="text-muted-foreground ml-2">
                    {new Date(contractStatus.sentAt).toLocaleString()}
                  </span>
                )}
              </span>
            </>
          ) : (
            <>
              <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">
                Contract not yet sent
              </span>
            </>
          )}
        </div>

        {/* Contract Signed */}
        {contractStatus.sent && (
          <div className="flex items-center gap-2">
            {contractStatus.signed ? (
              <>
                <CheckCircle className="size-4 text-green-600" aria-hidden="true" />
                <span className="text-sm">
                  Contract signed by customer
                  {contractStatus.signedAt && (
                    <span className="text-muted-foreground ml-2">
                      {new Date(contractStatus.signedAt).toLocaleString()}
                    </span>
                  )}
                </span>
              </>
            ) : (
              <>
                <FileText className="size-4 text-yellow-600" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  Awaiting customer signature
                </span>
              </>
            )}
          </div>
        )}

        {/* Contract Approved */}
        {contractStatus.signed && (
          <div className="flex items-center gap-2">
            {contractStatus.approved ? (
              <>
                <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
                <span className="text-sm">
                  Contract approved by Palmetto
                  {contractStatus.approvedAt && (
                    <span className="text-muted-foreground ml-2">
                      {new Date(contractStatus.approvedAt).toLocaleString()}
                    </span>
                  )}
                </span>
              </>
            ) : (
              <>
                <Clock className="size-4 text-yellow-600" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  Awaiting Palmetto approval
                </span>
              </>
            )}
          </div>
        )}

        {/* Contract Voided */}
        {contractStatus.voided && (
          <div className="flex items-center gap-2">
            <XCircle className="size-4 text-red-600" aria-hidden="true" />
            <span className="text-sm text-red-600">
              Contract voided
              {contractStatus.voidedAt && (
                <span className="text-muted-foreground ml-2">
                  {new Date(contractStatus.voidedAt).toLocaleString()}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Contract Reinstated */}
        {contractStatus.reinstated && (
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-green-600" aria-hidden="true" />
            <span className="text-sm text-green-600">
              Contract reinstated
              {contractStatus.reinstatedAt && (
                <span className="text-muted-foreground ml-2">
                  {new Date(contractStatus.reinstatedAt).toLocaleString()}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
