"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, getProposalCustomerDisplay } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface FinanceApplication {
  id: string;
  proposalId: string;
  lenderId: string;
  externalApplicationId: string | null;
  status: string;
  applicationData: any;
  responseData: any;
  createdAt: string;
  updatedAt: string;
  proposal: {
    id: string;
    customerData: any;
    status: string;
  };
  milestones: {
    id: string;
    milestoneType: string;
    status: string;
    completedAt: string | null;
  }[];
}

interface FinanceOperationsTableProps {
  applications: FinanceApplication[];
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="size-3" />,
  },
  SUBMITTED: {
    label: "Submitted",
    variant: "default",
    icon: <Clock className="size-3" />,
  },
  APPROVED: {
    label: "Approved",
    variant: "default",
    icon: <CheckCircle2 className="size-3" />,
  },
  DENIED: {
    label: "Denied",
    variant: "destructive",
    icon: <XCircle className="size-3" />,
  },
  CONDITIONAL: {
    label: "Conditional",
    variant: "outline",
    icon: <AlertCircle className="size-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "secondary",
    icon: <XCircle className="size-3" />,
  },
};

export function FinanceOperationsTable({
  applications,
}: FinanceOperationsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return applications;
    return applications.filter((a) => a.status === statusFilter);
  }, [applications, statusFilter]);

  const needsAttention = useMemo(() => {
    return applications.filter((a) => a.status === "CONDITIONAL");
  }, [applications]);

  const handleRefreshStatus = async (applicationId: string) => {
    setRefreshingId(applicationId);
    try {
      const res = await fetch(
        `/api/finance/lightreach/status/${applicationId}?refresh=true`,
        { credentials: "same-origin" },
      );
      if (!res.ok) throw new Error("Failed to refresh");
      toast.success("Status refreshed");
      window.location.reload();
    } catch {
      toast.error("Failed to refresh status");
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <Card className="border-warning/30 bg-warning-light/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 bg-warning/10 rounded-md">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              Needs Attention ({needsAttention.length})
            </CardTitle>
            <CardDescription>
              Conditional applications with stipulations requiring action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsAttention.map((app) => {
                const customer = getProposalCustomerDisplay(
                  app.proposal.customerData,
                );
                return (
                  <Link
                    key={app.id}
                    href={`/proposals/${app.proposalId}/view`}
                    className="block p-3 border border-warning/20 rounded-lg hover:border-warning/40 hover:bg-warning-light/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {customer.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Conditional — requires stipulation resolution
                        </p>
                      </div>
                      <Badge variant="outline" className="gap-1 flex-shrink-0">
                        <AlertCircle className="size-3" />
                        Conditional
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="CONDITIONAL">Conditional</SelectItem>
            <SelectItem value="DENIED">Denied</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} application{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">External ID</th>
                  <th className="text-left p-3 font-medium">Monthly Payment</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-left p-3 font-medium">Updated</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No finance applications found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((app) => {
                    const customer = getProposalCustomerDisplay(
                      app.proposal.customerData,
                    );
                    const config = statusConfig[app.status] ||
                      statusConfig.PENDING;
                    const monthlyPayment =
                      app.responseData?.monthlyPayment;

                    return (
                      <tr
                        key={app.id}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3">
                          <Link
                            href={`/proposals/${app.proposalId}/view`}
                            className="font-medium text-foreground hover:text-primary-600 transition-colors"
                          >
                            {customer.name}
                          </Link>
                        </td>
                        <td className="p-3">
                          <Badge variant={config.variant} className="gap-1">
                            <span aria-hidden="true">{config.icon}</span>
                            {config.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">
                          {app.externalApplicationId || "—"}
                        </td>
                        <td className="p-3">
                          {monthlyPayment
                            ? formatCurrency(monthlyPayment)
                            : "—"}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {format(new Date(app.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {format(new Date(app.updatedAt), "MMM d, yyyy")}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/proposals/${app.proposalId}/view`}>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="size-3.5" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRefreshStatus(app.id)}
                              disabled={refreshingId === app.id}
                            >
                              {refreshingId === app.id ? (
                                <Spinner className="size-3.5" />
                              ) : (
                                <RefreshCw className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
