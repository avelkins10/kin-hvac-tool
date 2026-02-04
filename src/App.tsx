"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PriceBookProvider } from "./contexts/PriceBookContext";
import { MaintenanceProvider } from "./contexts/MaintenanceContext";
import { IncentivesProvider } from "./contexts/IncentivesContext";
import { ProposalBuilder } from "@/components/proposal-builder/ProposalBuilder";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { Toaster } from "sonner";
import { BuilderNavigation } from "@/components/builder/BuilderNavigation";

// #region agent log
const LOG_ENDPOINT =
  "http://127.0.0.1:7243/ingest/a83938d5-3a77-4ab6-916c-dbc5e276a756";
function log(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
) {
  fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId,
    }),
  }).catch(() => {});
}
// #endregion

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const saveRef = useRef<(() => Promise<void>) | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Defer mounting assessment to avoid synchronous render loop on first paint
  const [mounted, setMounted] = useState(false);
  // #region agent log
  const appRenderCountRef = useRef(0);
  appRenderCountRef.current += 1;
  log(
    "App.tsx:render",
    "App render",
    { renderCount: appRenderCountRef.current, mounted, showAdmin },
    "A",
  );
  // #endregion
  useEffect(() => {
    // #region agent log
    log("App.tsx:useEffect", "App setMounted(true)", {}, "E");
    // #endregion
    setMounted(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (saveRef.current) {
      setIsSaving(true);
      try {
        await saveRef.current();
      } finally {
        setIsSaving(false);
      }
    }
  }, []);

  const handleAdminAccess = useCallback(() => setShowAdmin(true), []);
  const handleCloseAdmin = useCallback(() => setShowAdmin(false), []);
  const handleSaveRef = useCallback((saveFn: () => Promise<void>) => {
    saveRef.current = saveFn;
  }, []);
  // Only update parent proposalId when it actually changes to avoid re-render loops
  const handleProposalIdChange = useCallback((id: string | null) => {
    setProposalId((prev) => (prev === id ? prev : id));
  }, []);

  return (
    <PriceBookProvider>
      <MaintenanceProvider>
        <IncentivesProvider>
          <div className="min-h-screen bg-background">
            {showAdmin ? (
              <div className="relative">
                <button
                  onClick={handleCloseAdmin}
                  className="absolute top-4 right-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  Back to Builder
                </button>
                <AdminSettings />
              </div>
            ) : (
              <>
                <BuilderNavigation
                  onSave={handleSave}
                  proposalId={proposalId}
                  isSaving={isSaving}
                />
                {mounted && (
                  <ProposalBuilder
                    onAdminAccess={handleAdminAccess}
                    onSaveRef={handleSaveRef}
                    onProposalIdChange={handleProposalIdChange}
                  />
                )}
              </>
            )}
          </div>
          <Toaster />
        </IncentivesProvider>
      </MaintenanceProvider>
    </PriceBookProvider>
  );
}
