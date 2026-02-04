"use client";

import { CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinanceInstallPackageLinkProps {
  proposalId: string;
  submittedAt?: string;
}

export function FinanceInstallPackageLink({
  proposalId,
  submittedAt,
}: FinanceInstallPackageLinkProps) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium mb-2 flex items-center gap-2">
        <Package className="size-4" aria-hidden="true" />
        Install Package
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        After installation is complete, submit the install package with serial
        numbers and photos for NTP approval.
      </p>
      {submittedAt ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="size-4" aria-hidden="true" />
          <span>Submitted {new Date(submittedAt).toLocaleString()}</span>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            (window.location.href = `/proposals/${proposalId}/install-package`)
          }
        >
          Submit Install Package
        </Button>
      )}
    </div>
  );
}
