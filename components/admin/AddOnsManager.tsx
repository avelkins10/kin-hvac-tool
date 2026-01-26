"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Pencil, Package, Save, X } from 'lucide-react'
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

interface AddOn {
  id: string
  name: string
  baseCost: number
  marginType: string | null
  marginAmount: number | null
  createdAt: string
  updatedAt: string
}

export function AddOnsManager() {
  const [addons, setAddons] = useState<AddOn[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<AddOn | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    baseCost: '',
    marginType: '',
    marginAmount: '',
  })

  useEffect(() => {
    fetchAddons()
  }, [])

  const fetchAddons = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company/addons')
      if (response.ok) {
        const data = await response.json()
        setAddons(data)
      } else {
        toast.error('Failed to load add-ons')
      }
    } catch (error) {
      console.error('Error fetching addons:', error)
      toast.error('Failed to load add-ons')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAddon(null)
    setFormData({
      name: '',
      baseCost: '',
      marginType: '',
      marginAmount: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (addon: AddOn) => {
    setEditingAddon(addon)
    setFormData({
      name: addon.name,
      baseCost: addon.baseCost.toString(),
      marginType: addon.marginType || '',
      marginAmount: addon.marginAmount?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        baseCost: Number(formData.baseCost),
        marginType: formData.marginType || null,
        marginAmount: formData.marginAmount ? Number(formData.marginAmount) : null,
      }

      const url = editingAddon
        ? `/api/company/addons/${editingAddon.id}`
        : '/api/company/addons'
      const method = editingAddon ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(editingAddon ? 'Add-on updated' : 'Add-on created')
        setDialogOpen(false)
        fetchAddons()
      } else {
        toast.error('Failed to save add-on')
      }
    } catch (error) {
      console.error('Error saving addon:', error)
      toast.error('Failed to save add-on')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this add-on?')) return

    try {
      const response = await fetch(`/api/company/addons/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Add-on deleted')
        fetchAddons()
      } else {
        toast.error('Failed to delete add-on')
      }
    } catch (error) {
      console.error('Error deleting addon:', error)
      toast.error('Failed to delete add-on')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Add-Ons
            </CardTitle>
            <CardDescription>
              Manage add-on products and services
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Add-On
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading add-ons...</div>
          ) : addons.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No add-ons configured. Click "Add Add-On" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{addon.name}</h3>
                    <div className="text-sm text-gray-600">
                      Base Cost: ${addon.baseCost.toLocaleString()}
                      {addon.marginType && addon.marginAmount && (
                        <span className="ml-4">
                          Margin: {addon.marginType} {addon.marginAmount}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(addon)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(addon.id)}>
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
              {editingAddon ? 'Edit Add-On' : 'Create Add-On'}
            </DialogTitle>
            <DialogDescription>
              Configure the add-on details and pricing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="addonName">Add-On Name</Label>
              <Input
                id="addonName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Smart Thermostat"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addonBaseCost">Base Cost ($)</Label>
                <Input
                  id="addonBaseCost"
                  type="number"
                  value={formData.baseCost}
                  onChange={(e) => setFormData({ ...formData, baseCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="addonMarginType">Margin Type</Label>
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
            </div>
            <div>
              <Label htmlFor="addonMarginAmount">Margin Amount</Label>
              <Input
                id="addonMarginAmount"
                type="number"
                value={formData.marginAmount}
                onChange={(e) => setFormData({ ...formData, marginAmount: e.target.value })}
                placeholder="0"
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
              {editingAddon ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
