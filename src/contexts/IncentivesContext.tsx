"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Incentive {
  id: string
  name: string
  amount: number
  type: "rebate" | "tax_credit" | "discount"
  description: string
  requirements: string[]
  available: boolean
}

const defaultIncentives: Incentive[] = [
  {
    id: "1",
    name: "Federal Tax Credit",
    amount: 2000,
    type: "tax_credit",
    description: "Federal energy efficiency tax credit for qualifying HVAC systems",
    requirements: [
      "Must be primary residence",
      "System must meet SEER 16+ rating",
      "Installation by certified contractor",
    ],
    available: true,
  },
  {
    id: "2",
    name: "Utility Rebate",
    amount: 500,
    type: "rebate",
    description: "Local utility company rebate for high-efficiency equipment",
    requirements: ["Active utility account required", "Must be ENERGY STAR certified"],
    available: true,
  },
  {
    id: "3",
    name: "Manufacturer Rebate",
    amount: 300,
    type: "rebate",
    description: "Seasonal manufacturer rebate on select equipment",
    requirements: ["Limited time offer", "Select models only"],
    available: true,
  },
]

interface IncentivesContextType {
  incentives: Incentive[]
  selectedIncentives: Incentive[]
  setSelectedIncentives: (incentives: Incentive[]) => void
  toggleIncentive: (incentive: Incentive) => void
  getTotalIncentives: () => number
  updateIncentive: (incentive: Incentive) => void
  addIncentive: (incentive: Omit<Incentive, "id">) => void
  deleteIncentive: (id: string) => void
}

const IncentivesContext = createContext<IncentivesContextType | undefined>(undefined)

export function IncentivesProvider({ children }: { children: ReactNode }) {
  const [incentives, setIncentives] = useState<Incentive[]>(defaultIncentives)
  const [selectedIncentives, setSelectedIncentives] = useState<Incentive[]>([])
  const [loading, setLoading] = useState(true)

  // Load incentives from API
  useEffect(() => {
    const loadIncentives = async () => {
      try {
        const response = await fetch('/api/company/incentives')
        if (response.ok) {
          const data = await response.json()
          // Transform API data to match Incentive interface
          const transformed = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            amount: item.amount,
            type: item.type || 'rebate',
            description: item.description || '',
            requirements: [],
            available: true,
          }))
          if (transformed.length > 0) {
            setIncentives(transformed)
          }
        }
      } catch (error) {
        console.error('Failed to load incentives from API', error)
      } finally {
        setLoading(false)
      }
    }
    loadIncentives()
  }, [])

  const toggleIncentive = (incentive: Incentive) => {
    setSelectedIncentives((prev) => {
      const exists = prev.find((i) => i.id === incentive.id)
      if (exists) {
        return prev.filter((i) => i.id !== incentive.id)
      }
      return [...prev, incentive]
    })
  }

  const getTotalIncentives = () => {
    return selectedIncentives.reduce((sum, i) => sum + i.amount, 0)
  }

  const updateIncentive = async (incentive: Incentive) => {
    try {
      const response = await fetch(`/api/company/incentives/${incentive.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: incentive.name,
          amount: incentive.amount,
          type: incentive.type,
          description: incentive.description,
        }),
      })
      if (response.ok) {
        setIncentives((prev) => prev.map((i) => (i.id === incentive.id ? incentive : i)))
      }
    } catch (error) {
      console.error('Failed to update incentive', error)
    }
  }

  const addIncentive = async (incentive: Omit<Incentive, "id">) => {
    try {
      const response = await fetch('/api/company/incentives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: incentive.name,
          amount: incentive.amount,
          type: incentive.type,
          description: incentive.description,
        }),
      })
      if (response.ok) {
        const newIncentive = await response.json()
        setIncentives((prev) => [...prev, { ...incentive, id: newIncentive.id }])
      }
    } catch (error) {
      console.error('Failed to add incentive', error)
    }
  }

  const deleteIncentive = async (id: string) => {
    try {
      const response = await fetch(`/api/company/incentives/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setIncentives((prev) => prev.filter((i) => i.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete incentive', error)
    }
  }

  return (
    <IncentivesContext.Provider
      value={{
        incentives,
        selectedIncentives,
        setSelectedIncentives,
        toggleIncentive,
        getTotalIncentives,
        updateIncentive,
        addIncentive,
        deleteIncentive,
      }}
    >
      {children}
    </IncentivesContext.Provider>
  )
}

export function useIncentives() {
  const context = useContext(IncentivesContext)
  if (!context) {
    throw new Error("useIncentives must be used within an IncentivesProvider")
  }
  return context
}
