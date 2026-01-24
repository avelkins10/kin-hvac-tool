'use client'

import { useState } from 'react'
import { FinanceApplicationList } from './FinanceApplicationList'
import { FinanceApplicationForm } from './FinanceApplicationForm'
import { FinanceApplicationStatus } from './FinanceApplicationStatus'
import { shouldShowFinanceApplication, extractCustomerDataFromProposal, getSystemPriceFromProposal } from '@/lib/finance-helpers'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface ProposalFinanceSectionProps {
  proposal: {
    id: string
    paymentMethod?: any
    financingOption?: any
    customerData?: any
    totals?: any
    [key: string]: any
  }
}

export function ProposalFinanceSection({ proposal }: ProposalFinanceSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)

  // Only show if Comfort Plan is selected
  if (!shouldShowFinanceApplication(proposal)) {
    return null
  }

  const customerData = extractCustomerDataFromProposal(proposal)
  const systemPrice = getSystemPriceFromProposal(proposal)

  const handleFormSuccess = (applicationId: string) => {
    setShowForm(false)
    setSelectedApplicationId(applicationId)
  }

  if (selectedApplicationId) {
    return (
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => setSelectedApplicationId(null)}
          className="mb-4"
        >
          ← Back to Applications
        </Button>
        <FinanceApplicationStatus applicationId={selectedApplicationId} autoRefresh />
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Comfort Plan Finance Application</h2>
        <Button onClick={() => setShowForm(true)} size="sm">
          <FileText className="size-4 mr-2" />
          Submit Application
        </Button>
      </div>

      <FinanceApplicationList
        proposalId={proposal.id}
        onNewApplication={() => setShowForm(true)}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Comfort Plan Finance Application</DialogTitle>
          </DialogHeader>
          <FinanceApplicationForm
            proposalId={proposal.id}
            systemPrice={systemPrice}
            initialData={customerData}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
