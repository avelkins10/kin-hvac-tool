"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Mail } from "lucide-react";

interface SendContractButtonProps {
  accountId: string;
}

export function SendContractButton({ accountId }: SendContractButtonProps) {
  const [sending, setSending] = useState(false);

  const handleSendContract = async () => {
    setSending(true);
    try {
      const res = await fetch(
        `/api/finance/lightreach/contract/${accountId}?action=send`,
        {
          method: "POST",
          credentials: "same-origin",
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send contract");
      }
      toast.success("Contract sent to customer");
      // Refresh the page to show updated status
      window.location.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send contract",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium mb-2 flex items-center gap-2">
        <Mail className="size-4" aria-hidden="true" />
        Send Contract
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        Send the financing contract to the customer for electronic signature via
        DocuSign.
      </p>
      <Button onClick={handleSendContract} disabled={sending} size="sm">
        {sending ? (
          <>
            <Spinner className="size-4 mr-2" aria-hidden="true" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="size-4 mr-2" aria-hidden="true" />
            Send Contract
          </>
        )}
      </Button>
    </div>
  );
}
