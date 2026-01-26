"use client"

import { useState, useEffect } from 'react'
import { usePriceBook } from '@/src/contexts/PriceBookContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Pencil, CreditCard, Save, X } from 'lucide-react'
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

interface FinancingOption {
  id: string
  name: string
  type: string
  terms: any | null  // JSON field
  apr: number | null
  createdAt: string
  updatedAt: string
}

export function FinancingOptionsManager() {
  const { refreshPriceBook } = usePriceBook()
  const [options, setOptions] = useState<FinancingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<FinancingOption | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    terms: '',
    apr: '',
  })

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company/financing-options')
      if (response.ok) {
        const data = await response.json()
        setOptions(data)
      } else {
        toast.error('Failed to load financing options')
      }
    } catch (error) {
      console.error('Error fetching options:', error)
      toast.error('Failed to load financing options')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingOption(null)
    setFormData({
      name: '',
      type: '',
      terms: '',
      apr: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (option: FinancingOption) => {
    setEditingOption(option)
    setFormData({
      name: option.name,
      type: option.type,
      terms: typeof option.terms === 'string' ? option.terms : (option.terms ? JSON.stringify(option.terms) : ''),
      apr: option.apr?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      let termsValue = null
      if (formData.terms) {
        try {
          termsValue = JSON.parse(formData.terms)
        } catch {
          termsValue = formData.terms // If not valid JSON, store as string
        }
      }

      const payload = {
        name: formData.name,
        type: formData.type,
        terms: termsValue,
        apr: formData.apr ? Number(formData.apr) : null,
      }

      const url = editingOption
        ? `/api/company/financing-options/${editingOption.id}`
        : '/api/company/financing-options'
      const method = editingOption ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(editingOption ? 'Financing option updated' : 'Financing option created')
        setDialogOpen(false)
        await fetchOptions()
        await refreshPriceBook()
      } else {
        toast.error('Failed to save financing option')
      }
    } catch (error) {
      console.error('Error saving option:', error)
      toast.error('Failed to save financing option')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this financing option?')) return

    try {
      const response = await fetch(`/api/company/financing-options/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Financing option deleted')
        await fetchOptions()
        await refreshPriceBook()
      } else {
        toast.error('Failed to delete financing option')
      }
    } catch (error) {
      console.error('Error deleting option:', error)
      toast.error('Failed to delete financing option')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Financing Options
            </CardTitle>
            <CardDescription>
              Manage financing and payment options
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Option
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading options...</div>
          ) : options.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No financing options configured. Click "Add Option" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{option.name}</h3>
                    <div className="text-sm text-gray-600">
                      Type: {option.type}
                      {option.terms && (
                        <span className="ml-4">
                          Terms: {typeof option.terms === 'string' ? option.terms : JSON.stringify(option.terms)}
                        </span>
                      )}
                      {option.apr && <span className="ml-4">APR: {option.apr}%</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(option)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(option.id)}>
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
              {editingOption ? 'Edit Financing Option' : 'Create Financing Option'}
            </DialogTitle>
            <DialogDescription>
              Configure the financing option details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="optionName">Option Name</Label>
              <Input
                id="optionName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 0% APR for 12 Months"
              />
            </div>
            <div>
              <Label htmlFor="optionType">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leasing">Leasing</SelectItem>
                  <SelectItem value="financing">Financing</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="optionTerms">Terms</Label>
                <Input
                  id="optionTerms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="e.g., 12 months"
                />
              </div>
              <div>
                <Label htmlFor="optionApr">APR (%)</Label>
                <Input
                  id="optionApr"
                  type="number"
                  step="0.01"
                  value={formData.apr}
                  onChange={(e) => setFormData({ ...formData, apr: e.target.value })}
                  placeholder="0.00"
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
              {editingOption ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
