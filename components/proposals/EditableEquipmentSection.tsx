"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface EquipmentData {
  brand?: string
  model?: string
  tonnage?: number | string
  seer?: number | string
  price?: number
  tier?: string
  [key: string]: unknown
}

interface PriceBookUnit {
  id: string
  brand: string
  model: string
  tonnage: number | null
  tier: string | null
  baseCost: number
}

const SEER_OPTIONS = [14, 15, 16, 17, 18, 20, 22]

interface EditableEquipmentSectionProps {
  equipment: EquipmentData | null
  proposalId: string
  onUpdate?: () => void
}

export function EditableEquipmentSection({ equipment, proposalId, onUpdate }: EditableEquipmentSectionProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [units, setUnits] = useState<PriceBookUnit[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)
  const [formData, setFormData] = useState<EquipmentData>(equipment || {
    brand: '',
    model: '',
    tonnage: '',
    seer: '',
    price: 0,
  })

  const fetchPricebook = useCallback(async () => {
    setUnitsLoading(true)
    try {
      const res = await fetch('/api/company/pricebook')
      if (res.ok) {
        const data = await res.json()
        setUnits(Array.isArray(data) ? data : [])
      }
    } catch {
      setUnits([])
    } finally {
      setUnitsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isEditing) {
      fetchPricebook()
    }
  }, [isEditing, fetchPricebook])

  const brands = [...new Set(units.map((u) => u.brand))].sort()
  const modelsForBrand = formData.brand
    ? [...new Set(units.filter((u) => u.brand === formData.brand).map((u) => u.model))].sort()
    : []
  const unitsForBrandModel = formData.brand && formData.model
    ? units.filter((u) => u.brand === formData.brand && u.model === formData.model)
    : []
  const tonnageOptions: { value: string; label: string }[] = unitsForBrandModel.length
    ? [...new Map(
        unitsForBrandModel.map((u) => [
          u.tonnage != null ? String(u.tonnage) : '__null__',
          u.tonnage != null ? `${u.tonnage} ton` : '—',
        ])
      ).entries()].map(([value, label]) => ({ value, label }))
    : []

  const handleBrandChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      brand: value,
      model: '',
      tonnage: '',
      price: prev.price ?? 0,
    }))
  }

  const handleModelChange = (value: string) => {
    setFormData((prev) => {
      const matching = units.filter((u) => u.brand === prev.brand && u.model === value)
      const singleUnit = matching.length === 1 ? matching[0] : null
      return {
        ...prev,
        model: value,
        tonnage: '',
        price: singleUnit?.baseCost ?? prev.price ?? 0,
      }
    })
  }

  const handleTonnageChange = (value: string) => {
    const numValue = value === '' || value === '__null__' ? (value === '__null__' ? '' : value) : Number(value)
    setFormData((prev) => {
      const unit = units.find(
        (u) =>
          u.brand === prev.brand &&
          u.model === prev.model &&
          (value === '__null__' ? u.tonnage == null : u.tonnage != null && u.tonnage === Number(value))
      )
      return {
        ...prev,
        tonnage: value === '__null__' ? '' : numValue,
        price: unit?.baseCost ?? prev.price ?? 0,
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedEquipment: {
            ...formData,
            tonnage: formData.tonnage !== '' ? Number(formData.tonnage) : undefined,
            seer: formData.seer !== '' ? Number(formData.seer) : undefined,
            price: formData.price != null ? Number(formData.price) : undefined,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update equipment')
      }

      toast.success('Equipment information updated successfully')
      setIsEditing(false)
      router.refresh()
      onUpdate?.()
    } catch (error) {
      toast.error('Failed to update equipment information')
      console.error('Error updating equipment:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(equipment || {
      brand: '',
      model: '',
      tonnage: '',
      seer: '',
      price: 0,
    })
    setIsEditing(false)
  }

  const hasOptions = units.length > 0

  if (!equipment && !isEditing) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Selected Equipment</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Add Equipment
          </Button>
        </div>
        <p className="text-gray-500 text-sm">No equipment selected</p>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Selected Equipment</h2>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="bg-gray-50 p-4 rounded space-y-4">
          {unitsLoading ? (
            <p className="text-sm text-gray-500">Loading equipment options...</p>
          ) : !hasOptions ? (
            <p className="text-sm text-amber-700">
              No equipment options in admin. Add units in Admin → Price Book to select from the list, or enter below.
            </p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hasOptions ? (
              <>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select
                    value={formData.brand || ''}
                    onValueChange={handleBrandChange}
                  >
                    <SelectTrigger id="brand" className="w-full">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    value={formData.model || ''}
                    onValueChange={handleModelChange}
                    disabled={!formData.brand}
                  >
                    <SelectTrigger id="model" className="w-full">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelsForBrand.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tonnage</Label>
                  <Select
                    value={
                      formData.tonnage !== '' && formData.tonnage != null
                        ? String(formData.tonnage)
                        : tonnageOptions.some((o) => o.value === '__null__') && formData.brand && formData.model
                          ? '__null__'
                          : ''
                    }
                    onValueChange={handleTonnageChange}
                    disabled={!formData.model}
                  >
                    <SelectTrigger id="tonnage" className="w-full">
                      <SelectValue placeholder="Select tonnage" />
                    </SelectTrigger>
                    <SelectContent>
                      {tonnageOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                    placeholder="Brand name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder="Model number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tonnage">Tonnage</Label>
                  <Input
                    id="tonnage"
                    type="number"
                    value={formData.tonnage || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tonnage: e.target.value }))}
                    placeholder="5"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>SEER Rating</Label>
              <Select
                value={formData.seer !== '' && formData.seer != null ? String(formData.seer) : ''}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, seer: value }))}
              >
                <SelectTrigger id="seer" className="w-full">
                  <SelectValue placeholder="Select SEER" />
                </SelectTrigger>
                <SelectContent>
                  {SEER_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} SEER
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price != null ? formData.price : ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value === '' ? 0 : Number(e.target.value) }))}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded">
          {equipment?.brand && <p><strong>Brand:</strong> {equipment.brand}</p>}
          {equipment?.model && <p><strong>Model:</strong> {equipment.model}</p>}
          {equipment?.tonnage != null && <p><strong>Tonnage:</strong> {equipment.tonnage}</p>}
          {equipment?.seer != null && <p><strong>SEER:</strong> {equipment.seer}</p>}
          {equipment?.price != null && <p><strong>Price:</strong> ${Number(equipment.price).toFixed(2)}</p>}
        </div>
      )}
    </div>
  )
}
