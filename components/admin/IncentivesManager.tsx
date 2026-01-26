"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Pencil, Gift, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Incentive {
  id: string
  name: string
  amount: number
  type: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export function IncentivesManager() {
  const [incentives, setIncentives] = useState<Incentive[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIncentive, setEditingIncentive] = useState<Incentive | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: '',
    description: '',
  })

  useEffect(() => {
    fetchIncentives()
  }, [])

  const fetchIncentives = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company/incentives')
      if (response.ok) {
        const data = await response.json()
        setIncentives(data)
      } else {
        toast.error('Failed to load incentives')
      }
    } catch (error) {
      console.error('Error fetching incentives:', error)
      toast.error('Failed to load incentives')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingIncentive(null)
    setFormData({
      name: '',
      amount: '',
      type: '',
      description: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (incentive: Incentive) => {
    setEditingIncentive(incentive)
    setFormData({
      name: incentive.name,
      amount: incentive.amount.toString(),
      type: incentive.type || '',
      description: incentive.description || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        amount: Number(formData.amount),
        type: formData.type || null,
        description: formData.description || null,
      }

      const url = editingIncentive
        ? `/api/company/incentives/${editingIncentive.id}`
        : '/api/company/incentives'
      const method = editingIncentive ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(editingIncentive ? 'Incentive updated' : 'Incentive created')
        setDialogOpen(false)
        fetchIncentives()
      } else {
        toast.error('Failed to save incentive')
      }
    } catch (error) {
      console.error('Error saving incentive:', error)
      toast.error('Failed to save incentive')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incentive?')) return

    try {
      const response = await fetch(`/api/company/incentives/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Incentive deleted')
        fetchIncentives()
      } else {
        toast.error('Failed to delete incentive')
      }
    } catch (error) {
      console.error('Error deleting incentive:', error)
      toast.error('Failed to delete incentive')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Incentives
            </CardTitle>
            <CardDescription>
              Manage rebates, tax credits, and other incentives
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Incentive
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading incentives...</div>
          ) : incentives.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No incentives configured. Click "Add Incentive" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {incentives.map((incentive) => (
                <div
                  key={incentive.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{incentive.name}</h3>
                    <div className="text-sm text-gray-600">
                      Amount: ${incentive.amount.toLocaleString()}
                      {incentive.type && (
                        <span className="ml-4">Type: {incentive.type}</span>
                      )}
                    </div>
                    {incentive.description && (
                      <p className="text-sm text-gray-500 mt-1">{incentive.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(incentive)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(incentive.id)}>
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
              {editingIncentive ? 'Edit Incentive' : 'Create Incentive'}
            </DialogTitle>
            <DialogDescription>
              Configure the incentive details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="incentiveName">Incentive Name</Label>
              <Input
                id="incentiveName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Federal Tax Credit"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="incentiveAmount">Amount ($)</Label>
                <Input
                  id="incentiveAmount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="incentiveType">Type</Label>
                <Input
                  id="incentiveType"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., rebate, tax_credit"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="incentiveDescription">Description</Label>
              <Textarea
                id="incentiveDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {editingIncentive ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
