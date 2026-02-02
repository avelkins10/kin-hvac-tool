"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { PriceBookProvider } from "./contexts/PriceBookContext"
import { MaintenanceProvider } from "./contexts/MaintenanceContext"
import { IncentivesProvider } from "./contexts/IncentivesContext"
import { InteractiveHouseAssessment } from "./components/InteractiveHouseAssessment"
import { AdminPortal } from "./components/AdminPortal"
import { Toaster } from "sonner"
import { BuilderNavigation } from "@/components/builder/BuilderNavigation"

// #region agent log
const LOG_ENDPOINT = 'http://127.0.0.1:7243/ingest/a83938d5-3a77-4ab6-916c-dbc5e276a756'
function log(location: string, message: string, data: Record<string, unknown>, hypothesisId: string) {
  fetch(LOG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, message, data, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId }) }).catch(() => {})
}
// #endregion

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false)
  const saveRef = useRef<(() => Promise<void>) | null>(null)
  const [proposalId, setProposalId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Defer mounting assessment to avoid synchronous render loop on first paint
  const [mounted, setMounted] = useState(false)
  // #region agent log
  const appRenderCountRef = useRef(0)
  appRenderCountRef.current += 1
  log('App.tsx:render', 'App render', { renderCount: appRenderCountRef.current, mounted, showAdmin }, 'A')
  // #endregion
  useEffect(() => {
    // #region agent log
    log('App.tsx:useEffect', 'App setMounted(true)', {}, 'E')
    // #endregion
    setMounted(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (saveRef.current) {
      setIsSaving(true)
      try {
        await saveRef.current()
      } finally {
        setIsSaving(false)
      }
    }
  }, [])

  const handleAdminAccess = useCallback(() => setShowAdmin(true), [])
  const handleCloseAdmin = useCallback(() => setShowAdmin(false), [])
  const handleSaveRef = useCallback((saveFn: () => Promise<void>) => {
    saveRef.current = saveFn
  }, [])
  // Only update parent proposalId when it actually changes to avoid re-render loops
  const handleProposalIdChange = useCallback((id: string | null) => {
    setProposalId((prev) => (prev === id ? prev : id))
  }, [])

  return (
    <PriceBookProvider>
      <MaintenanceProvider>
        <IncentivesProvider>
          <div className="min-h-screen bg-background">
            {showAdmin ? (
              <AdminPortal onClose={handleCloseAdmin} />
            ) : (
              <>
                <BuilderNavigation
                  onSave={handleSave}
                  proposalId={proposalId}
                  isSaving={isSaving}
                />
                {mounted && (
                  <InteractiveHouseAssessment
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
  )
}
