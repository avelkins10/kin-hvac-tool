"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Pencil, Wrench, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MaintenancePlan {
  id: string
  name: string
  tier: string | null
  baseCost: number
  marginType: string | null
  marginAmount: number | null
  createdAt: string
  updatedAt: string
}

export function MaintenancePlansManager() {
  const [plans, setPlans] = useState<MaintenancePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    tier: '',
    baseCost: '',
    marginType: '',
    marginAmount: '',
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company/maintenance-plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      } else {
        toast.error('Failed to load maintenance plans')
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Failed to load maintenance plans')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPlan(null)
    setFormData({
      name: '',
      tier: '',
      baseCost: '',
      marginType: '',
      marginAmount: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (plan: MaintenancePlan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      tier: plan.tier || '',
      baseCost: plan.baseCost.toString(),
      marginType: plan.marginType || '',
      marginAmount: plan.marginAmount?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        tier: formData.tier || null,
        baseCost: Number(formData.baseCost),
        marginType: formData.marginType || null,
        marginAmount: formData.marginAmount ? Number(formData.marginAmount) : null,
      }

      const url = editingPlan
        ? `/api/company/maintenance-plans/${editingPlan.id}`
        : '/api/company/maintenance-plans'
      const method = editingPlan ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(editingPlan ? 'Maintenance plan updated' : 'Maintenance plan created')
        setDialogOpen(false)
        await fetchPlans()
        // Note: Context will refresh on next page load or manual refresh
      } else {
        toast.error('Failed to save maintenance plan')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error('Failed to save maintenance plan')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance plan?')) return

    try {
      const response = await fetch(`/api/company/maintenance-plans/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Maintenance plan deleted')
        await fetchPlans()
        // Note: Context will refresh on next page load or manual refresh
      } else {
        toast.error('Failed to delete maintenance plan')
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error('Failed to delete maintenance plan')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Maintenance Plans
            </CardTitle>
            <CardDescription>
              Manage maintenance and service plans
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No maintenance plans configured. Click "Add Plan" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{plan.name}</h3>
                      {plan.tier && (
                        <span className="text-sm text-gray-600">({plan.tier})</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Base Cost: ${plan.baseCost.toLocaleString()}
                      {plan.marginType && plan.marginAmount && (
                        <span className="ml-4">
                          Margin: {plan.marginType} {plan.marginAmount}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Maintenance Plan' : 'Create Maintenance Plan'}
            </DialogTitle>
            <DialogDescription>
              Configure the maintenance plan details and pricing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="planName">Plan Name</Label>
              <Input
                id="planName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Annual Maintenance Plan"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planTier">Tier</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(v) => setFormData({ ...formData, tier: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="planBaseCost">Base Cost ($)</Label>
                <Input
                  id="planBaseCost"
                  type="number"
                  value={formData.baseCost}
                  onChange={(e) => setFormData({ ...formData, baseCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planMarginType">Margin Type</Label>
                <Select
                  value={formData.marginType}
                  onValueChange={(v) => setFormData({ ...formData, marginType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="planMarginAmount">Margin Amount</Label>
                <Input
                  id="planMarginAmount"
                  type="number"
                  value={formData.marginAmount}
                  onChange={(e) => setFormData({ ...formData, marginAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
