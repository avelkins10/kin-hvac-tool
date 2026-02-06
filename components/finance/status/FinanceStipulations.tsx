"use client";

import { useState, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ListChecks,
  Upload,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface FinanceStipulationsProps {
  stipulations: any[] | null;
  loading: boolean;
  accountId?: string;
  onDocumentUploaded?: () => void;
}

const DOCUMENT_TYPES = [
  { value: "bluetoothHVACTool", label: "Bluetooth HVAC Tool" },
  { value: "proofOfLoadHVAC", label: "Proof of Load HVAC" },
  { value: "hvacInstallationPhotos", label: "HVAC Installation Photos" },
  { value: "other", label: "Other" },
] as const;

interface UploadState {
  uploading: boolean;
  success: boolean;
  documentId?: string;
}

export function FinanceStipulations({
  stipulations,
  loading,
  accountId,
  onDocumentUploaded,
}: FinanceStipulationsProps) {
  const [uploadStates, setUploadStates] = useState<Record<number, UploadState>>(
    {},
  );
  const [docTypes, setDocTypes] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const handleUpload = async (index: number, file: File) => {
    const docType = docTypes[index] || "other";

    if (!accountId) {
      toast.error("Account ID not available for upload");
      return;
    }

    setUploadStates((prev) => ({
      ...prev,
      [index]: { uploading: true, success: false },
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", docType);

      const res = await fetch(
        `/api/finance/lightreach/documents/${accountId}`,
        {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setUploadStates((prev) => ({
        ...prev,
        [index]: {
          uploading: false,
          success: true,
          documentId: data.documentId,
        },
      }));
      toast.success("Document uploaded successfully");
      onDocumentUploaded?.();
    } catch (error: any) {
      setUploadStates((prev) => ({
        ...prev,
        [index]: { uploading: false, success: false },
      }));
      toast.error(error.message || "Failed to upload document");
    }
  };

  const handleFileSelect = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(index, file);
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium flex items-center gap-2">
        <ListChecks className="size-4" aria-hidden="true" />
        Stipulations
      </p>
      {loading ? (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
        >
          <Spinner className="size-4" aria-hidden="true" />
          Loading stipulations...
        </div>
      ) : Array.isArray(stipulations) && stipulations.length > 0 ? (
        <ul className="space-y-3">
          {stipulations.map((s: any, i: number) => {
            const uploadState = uploadStates[i];
            const description =
              typeof s === "object"
                ? (s.description ?? s.type ?? s.name ?? JSON.stringify(s))
                : String(s);

            return (
              <li key={i} className="rounded-md border p-3 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  {uploadState?.success ? (
                    <CheckCircle2
                      className="size-4 text-green-600 mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertCircle
                      className="size-4 text-amber-600 mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span>{description}</span>
                </div>

                {uploadState?.success ? (
                  <p className="text-xs text-green-600 ml-6">
                    Document uploaded
                    {uploadState.documentId &&
                      ` (ID: ${uploadState.documentId})`}
                  </p>
                ) : accountId ? (
                  <div className="ml-6 flex items-center gap-2">
                    <Select
                      value={docTypes[i] || "other"}
                      onValueChange={(val) =>
                        setDocTypes((prev) => ({ ...prev, [i]: val }))
                      }
                    >
                      <SelectTrigger className="w-[200px] h-8 text-xs">
                        <SelectValue placeholder="Document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((dt) => (
                          <SelectItem key={dt.value} value={dt.value}>
                            {dt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <input
                      type="file"
                      ref={(el) => {
                        fileInputRefs.current[i] = el;
                      }}
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(i, e)}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleFileSelect(i)}
                      disabled={uploadState?.uploading}
                    >
                      {uploadState?.uploading ? (
                        <>
                          <Spinner
                            className="size-3 mr-1.5"
                            aria-hidden="true"
                          />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload
                            className="size-3 mr-1.5"
                            aria-hidden="true"
                          />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No stipulations or all cleared.
        </p>
      )}
    </div>
  );
}
