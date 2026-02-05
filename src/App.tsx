"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { PriceBookProvider } from "./contexts/PriceBookContext"
import { MaintenanceProvider } from "./contexts/MaintenanceContext"
import { IncentivesProvider } from "./contexts/IncentivesContext"
import { InteractiveHouseAssessment } from "./components/InteractiveHouseAssessment"
import { AdminSettingsContent } from "@/components/admin/AdminSettings"
import { Toaster } from "sonner"
import { BuilderNavigation } from "@/components/builder/BuilderNavigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false)
  const saveRef = useRef<(() => Promise<void>) | null>(null)
  const [proposalId, setProposalId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Defer mounting assessment to avoid synchronous render loop on first paint
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
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
              <>
                <div className="border-b bg-white px-6 py-3">
                  <Button variant="ghost" onClick={handleCloseAdmin}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Builder
                  </Button>
                </div>
                <AdminSettingsContent />
              </>
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
