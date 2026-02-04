"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { FinanceQuoteSection } from "./FinanceQuoteSection";
import {
  FinanceStatusDetails,
  FinanceContractSection,
  FinanceStipulations,
  FinanceMilestones,
  FinanceInstallPackageLink,
  SendContractButton,
  type ApplicationData,
  type StatusConfig,
} from "./status";

interface FinanceApplicationStatusProps {
  applicationId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

const statusConfig: Record<string, StatusConfig> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="size-4" />,
  },
  SUBMITTED: {
    label: "Submitted",
    variant: "default",
    icon: <Clock className="size-4" />,
  },
  APPROVED: {
    label: "Approved",
    variant: "default",
    icon: <CheckCircle2 className="size-4" />,
  },
  DENIED: {
    label: "Denied",
    variant: "destructive",
    icon: <XCircle className="size-4" />,
  },
  CONDITIONAL: {
    label: "Conditional",
    variant: "outline",
    icon: <AlertCircle className="size-4" />,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "secondary",
    icon: <XCircle className="size-4" />,
  },
};

export function FinanceApplicationStatus({
  applicationId,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}: FinanceApplicationStatusProps) {
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stipulations, setStipulations] = useState<any[] | null>(null);
  const [stipulationsLoading, setStipulationsLoading] = useState(false);
  const [signingLinkLoading, setSigningLinkLoading] = useState(false);

  const fetchStatus = async (forceRefresh = false) => {
    try {
      const url = `/api/finance/lightreach/status/${applicationId}${forceRefresh ? "?refresh=true" : ""}`;
      const response = await fetch(url, { credentials: "same-origin" });

      if (!response.ok) {
        throw new Error("Failed to fetch application status");
      }

      const data = await response.json();
      setApplication(data);
    } catch (error) {
      console.error("Error fetching application status:", error);
      toast.error("Failed to fetch application status");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchStatus();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [applicationId, autoRefresh, refreshInterval]);

  // Fetch stipulations when LightReach and status is conditional/approved
  useEffect(() => {
    if (
      !application?.externalApplicationId ||
      application.externalApplicationId.startsWith("test_")
    )
      return;
    if (application.lenderId !== "lightreach") return;
    const s = application.status?.toUpperCase();
    if (s !== "CONDITIONAL" && s !== "APPROVED") return;

    let cancelled = false;
    setStipulationsLoading(true);
    fetch(`/api/finance/lightreach/stipulations/${applicationId}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setStipulations(data);
        else if (!cancelled && data && Array.isArray(data.stipulations))
          setStipulations(data.stipulations);
        else if (!cancelled) setStipulations(null);
      })
      .catch(() => {
        if (!cancelled) setStipulations(null);
      })
      .finally(() => {
        if (!cancelled) setStipulationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    applicationId,
    application?.externalApplicationId,
    application?.lenderId,
    application?.status,
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStatus(true);
  };

  const handleSignContract = async () => {
    if (!applicationId) return;
    setSigningLinkLoading(true);
    try {
      const res = await fetch(
        `/api/finance/lightreach/signing-link/${applicationId}`,
        { credentials: "same-origin" },
      );
      const data = await res.json();
      const url = data?.url ?? data?.signingLink;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("No signing link available");
    } catch {
      toast.error("Failed to get signing link");
    } finally {
      setSigningLinkLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent
          className="flex items-center justify-center py-8"
          role="status"
          aria-live="polite"
        >
          <Spinner className="size-6" aria-hidden="true" />
          <span className="ml-2">Loading application status...</span>
        </CardContent>
      </Card>
    );
  }

  if (!application) {
    return (
      <Card>
        <CardContent className="py-8" role="alert">
          <p className="text-center text-muted-foreground">
            Application not found
          </p>
        </CardContent>
      </Card>
    );
  }

  const status = application.status.toUpperCase();
  const config = statusConfig[status] || statusConfig.PENDING;
  const responseData = application.responseData || {};
  const isLightReach = application.lenderId === "lightreach";
  const hasExternalId = !!application.externalApplicationId;
  const isTestMode = application.externalApplicationId?.startsWith("test_");
  const isApprovedOrConditional = status === "APPROVED" || status === "CONDITIONAL";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Finance Application Status</CardTitle>
            <CardDescription>
              Application ID: {application.id.slice(0, 8)}...
              {application.externalApplicationId && (
                <> • External ID: {application.externalApplicationId}</>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Spinner className="size-4" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2" aria-live="polite">
          <Badge
            variant={config.variant}
            className="gap-1"
            aria-label={`Application status: ${config.label}`}
          >
            <span aria-hidden="true">{config.icon}</span>
            {config.label}
          </Badge>
          {application.cached && (
            <span className="text-xs text-muted-foreground">
              (Cached {application.cacheAge}s ago)
            </span>
          )}
        </div>

        {/* Payment Details */}
        <FinanceStatusDetails
          responseData={responseData}
          lenderId={application.lenderId}
        />

        {/* Message */}
        {responseData.message && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium mb-1">Message</p>
            <p className="text-sm text-muted-foreground">
              {responseData.message}
            </p>
          </div>
        )}

        {/* Quote Section - Show for approved LightReach applications when no contract yet */}
        {isLightReach &&
          hasExternalId &&
          !isTestMode &&
          isApprovedOrConditional &&
          !responseData.contractStatus?.sent && (
            <FinanceQuoteSection
              accountId={application.externalApplicationId!}
              totalSystemCost={
                (application.applicationData as any)?.systemPrice ||
                (application.applicationData as any)?.totalFinancedAmount ||
                0
              }
              state={(application.applicationData as any)?.state || "TX"}
            />
          )}

        {/* Contract Status Timeline */}
        {isLightReach && responseData.contractStatus && (
          <FinanceContractSection contractStatus={responseData.contractStatus} />
        )}

        {/* Sign contract button */}
        {isLightReach && hasExternalId && !isTestMode && isApprovedOrConditional && (
          <div className="rounded-lg border p-4">
            <Button
              onClick={handleSignContract}
              disabled={signingLinkLoading}
              className="w-full sm:w-auto"
            >
              {signingLinkLoading ? (
                <Spinner className="size-4 mr-2" aria-hidden="true" />
              ) : (
                <ExternalLink className="size-4 mr-2" aria-hidden="true" />
              )}
              Sign contract
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Opens the Palmetto contract signing page in a new tab.
            </p>
          </div>
        )}

        {/* Stipulations */}
        {isLightReach && isApprovedOrConditional && (
          <FinanceStipulations
            stipulations={stipulations}
            loading={stipulationsLoading}
          />
        )}

        {/* Milestones */}
        <FinanceMilestones
          milestones={responseData.milestones}
          milestonePackages={responseData.milestonePackages}
        />

        {/* Quote exceeds payment cap warning */}
        {responseData.quoteExceedsPaymentCap && (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4"
            role="alert"
          >
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              This quote exceeds the monthly payment cap. Review with the
              customer.
            </p>
          </div>
        )}

        {/* Send Contract Button */}
        {isLightReach &&
          hasExternalId &&
          !isTestMode &&
          isApprovedOrConditional &&
          !responseData.contractStatus?.sent && (
            <SendContractButton accountId={application.externalApplicationId!} />
          )}

        {/* Install Package Link */}
        {isLightReach &&
          hasExternalId &&
          application.proposalId &&
          (responseData.contractStatus?.approved || status === "APPROVED") && (
            <FinanceInstallPackageLink
              proposalId={application.proposalId}
              submittedAt={responseData.installPackage?.submittedAt}
            />
          )}

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Created: {new Date(application.createdAt).toLocaleString()}</p>
          {application.lastUpdated && (
            <p>
              Last Updated: {new Date(application.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
