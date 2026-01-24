"use client"

import { useState, useRef } from "react"
import { PriceBookProvider } from "./contexts/PriceBookContext"
import { MaintenanceProvider } from "./contexts/MaintenanceContext"
import { IncentivesProvider } from "./contexts/IncentivesContext"
import { InteractiveHouseAssessment } from "./components/InteractiveHouseAssessment"
import { AdminPortal } from "./components/AdminPortal"
import { Toaster } from "sonner"
import { BuilderNavigation } from "@/components/builder/BuilderNavigation"

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false)
  const saveRef = useRef<(() => Promise<void>) | null>(null)
  const [proposalId, setProposalId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (saveRef.current) {
      setIsSaving(true)
      try {
        await saveRef.current()
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <PriceBookProvider>
      <MaintenanceProvider>
        <IncentivesProvider>
          <div className="min-h-screen bg-background">
            {showAdmin ? (
              <AdminPortal onClose={() => setShowAdmin(false)} />
            ) : (
              <>
                <BuilderNavigation
                  onSave={handleSave}
                  proposalId={proposalId}
                  isSaving={isSaving}
                />
                <InteractiveHouseAssessment
                  onAdminAccess={() => setShowAdmin(true)}
                  onSaveRef={(saveFn) => { saveRef.current = saveFn }}
                  onProposalIdChange={setProposalId}
                />
              </>
            )}
          </div>
          <Toaster />
        </IncentivesProvider>
      </MaintenanceProvider>
    </PriceBookProvider>
  )
}
