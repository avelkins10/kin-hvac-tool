"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Pencil, Wind, Save, X } from 'lucide-react'
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

interface HVACSystem {
  id: string
  name: string
  tier: string | null
  baseCost: number
  marginType: string | null
  marginAmount: number | null
  createdAt: string
  updatedAt: string
}

export function HVACSystemsManager() {
  const [systems, setSystems] = useState<HVACSystem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSystem, setEditingSystem] = useState<HVACSystem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    tier: '',
    baseCost: '',
    marginType: '',
    marginAmount: '',
  })

  useEffect(() => {
    fetchSystems()
  }, [])

  const fetchSystems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company/hvac-systems')
      if (response.ok) {
        const data = await response.json()
        setSystems(data)
      } else {
        toast.error('Failed to load HVAC systems')
      }
    } catch (error) {
      console.error('Error fetching systems:', error)
      toast.error('Failed to load HVAC systems')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingSystem(null)
    setFormData({
      name: '',
      tier: '',
      baseCost: '',
      marginType: '',
      marginAmount: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (system: HVACSystem) => {
    setEditingSystem(system)
    setFormData({
      name: system.name,
      tier: system.tier || '',
      baseCost: system.baseCost.toString(),
      marginType: system.marginType || '',
      marginAmount: system.marginAmount?.toString() || '',
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

      const url = editingSystem
        ? `/api/company/hvac-systems/${editingSystem.id}`
        : '/api/company/hvac-systems'
      const method = editingSystem ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(editingSystem ? 'HVAC system updated' : 'HVAC system created')
        setDialogOpen(false)
        fetchSystems()
      } else {
        toast.error('Failed to save HVAC system')
      }
    } catch (error) {
      console.error('Error saving system:', error)
      toast.error('Failed to save HVAC system')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this HVAC system?')) return

    try {
      const response = await fetch(`/api/company/hvac-systems/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('HVAC system deleted')
        fetchSystems()
      } else {
        toast.error('Failed to delete HVAC system')
      }
    } catch (error) {
      console.error('Error deleting system:', error)
      toast.error('Failed to delete HVAC system')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wind className="w-5 h-5" />
              HVAC Systems
            </CardTitle>
            <CardDescription>
              Manage HVAC system configurations and pricing
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add System
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading systems...</div>
          ) : systems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No HVAC systems configured. Click "Add System" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {systems.map((system) => (
                <div
                  key={system.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{system.name}</h3>
                      {system.tier && (
                        <Badge variant="outline">{system.tier}</Badge>
                      )}
                      <span className="text-sm text-gray-600">
                        Base Cost: ${system.baseCost.toLocaleString()}
                      </span>
                    </div>
                    {system.marginType && system.marginAmount && (
                      <p className="text-sm text-gray-500">
                        Margin: {system.marginType} {system.marginAmount}%
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(system)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(system.id)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSystem ? 'Edit HVAC System' : 'Create HVAC System'}
            </DialogTitle>
            <DialogDescription>
              Configure the HVAC system details and pricing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">System Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Goodman 16 SEER 3 Ton"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(v) => setFormData({ ...formData, tier: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="better">Better</SelectItem>
                    <SelectItem value="best">Best</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="baseCost">Base Cost ($)</Label>
                <Input
                  id="baseCost"
                  type="number"
                  value={formData.baseCost}
                  onChange={(e) => setFormData({ ...formData, baseCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marginType">Margin Type</Label>
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
                <Label htmlFor="marginAmount">Margin Amount</Label>
                <Input
                  id="marginAmount"
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
              {editingSystem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
