"use client";

import {
  CheckCircle,
  Circle,
  Package,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinanceInstallPackageLinkProps {
  proposalId: string;
  submittedAt?: string;
  reviewFlags?: {
    serialNumberMismatch?: boolean;
    photosMissing?: boolean;
    permitIssue?: boolean;
    message?: string;
  };
  installStatus?: string;
}

const requirements = [
  { key: "serial", label: "Equipment serial numbers" },
  { key: "photos", label: "Installation photos" },
  { key: "permit", label: "Permit attestation" },
];

export function FinanceInstallPackageLink({
  proposalId,
  submittedAt,
  reviewFlags,
  installStatus,
}: FinanceInstallPackageLinkProps) {
  const hasIssues =
    reviewFlags?.serialNumberMismatch ||
    reviewFlags?.photosMissing ||
    reviewFlags?.permitIssue;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium flex items-center gap-2">
        <Package className="size-4" aria-hidden="true" />
        Install Package
      </p>

      {submittedAt ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="size-4" aria-hidden="true" />
            <span>Submitted {new Date(submittedAt).toLocaleString()}</span>
          </div>

          {installStatus && (
            <p className="text-xs text-muted-foreground">
              Status: {installStatus}
            </p>
          )}

          {hasIssues && (
            <div
              className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-1"
              role="alert"
            >
              <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                Review flags
              </p>
              {reviewFlags?.serialNumberMismatch && (
                <p className="text-xs text-amber-700">
                  Serial number mismatch detected
                </p>
              )}
              {reviewFlags?.photosMissing && (
                <p className="text-xs text-amber-700">
                  Installation photos missing or incomplete
                </p>
              )}
              {reviewFlags?.permitIssue && (
                <p className="text-xs text-amber-700">
                  Permit attestation issue
                </p>
              )}
              {reviewFlags?.message && (
                <p className="text-xs text-amber-700">{reviewFlags.message}</p>
              )}
            </div>
          )}

          {hasIssues && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                (window.location.href = `/proposals/${proposalId}/install-package`)
              }
            >
              <ExternalLink className="size-3.5 mr-1.5" aria-hidden="true" />
              Re-submit Install Package
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            After installation is complete, submit the install package with
            serial numbers and photos for NTP approval.
          </p>

          {/* Requirements checklist */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Required information
            </p>
            {requirements.map((req) => (
              <div
                key={req.key}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Circle className="size-3 flex-shrink-0" aria-hidden="true" />
                <span>{req.label}</span>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              (window.location.href = `/proposals/${proposalId}/install-package`)
            }
          >
            Submit Install Package
          </Button>
        </div>
      )}
    </div>
  );
}
