"use client"

import { useState } from "react"
import { PriceBookProvider } from "./contexts/PriceBookContext"
import { MaintenanceProvider } from "./contexts/MaintenanceContext"
import { IncentivesProvider } from "./contexts/IncentivesContext"
import { InteractiveHouseAssessment } from "./components/InteractiveHouseAssessment"
import { AdminPortal } from "./components/AdminPortal"
import { Toaster } from "sonner"

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <PriceBookProvider>
      <MaintenanceProvider>
        <IncentivesProvider>
          <div className="min-h-screen bg-background">
            {showAdmin ? (
              <AdminPortal onClose={() => setShowAdmin(false)} />
            ) : (
              <InteractiveHouseAssessment onAdminAccess={() => setShowAdmin(true)} />
            )}
          </div>
          <Toaster />
        </IncentivesProvider>
      </MaintenanceProvider>
    </PriceBookProvider>
  )
}
