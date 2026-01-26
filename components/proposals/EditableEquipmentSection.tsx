"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface EquipmentData {
  brand?: string
  model?: string
  tonnage?: number | string
  seer?: number | string
  price?: number
  [key: string]: any
}

interface EditableEquipmentSectionProps {
  equipment: EquipmentData | null
  proposalId: string
  onUpdate?: () => void
}

export function EditableEquipmentSection({ equipment, proposalId, onUpdate }: EditableEquipmentSectionProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<EquipmentData>(equipment || {
    brand: '',
    model: '',
    tonnage: '',
    seer: '',
    price: 0,
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedEquipment: {
            ...formData,
            tonnage: formData.tonnage ? Number(formData.tonnage) : undefined,
            seer: formData.seer ? Number(formData.seer) : undefined,
            price: formData.price ? Number(formData.price) : undefined,
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

  if (!equipment && !isEditing) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Selected Equipment</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
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
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="bg-gray-50 p-4 rounded space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Brand name"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Model number"
              />
            </div>
            <div>
              <Label htmlFor="tonnage">Tonnage</Label>
              <Input
                id="tonnage"
                type="number"
                value={formData.tonnage || ''}
                onChange={(e) => setFormData({ ...formData, tonnage: e.target.value })}
                placeholder="5"
              />
            </div>
            <div>
              <Label htmlFor="seer">SEER Rating</Label>
              <Input
                id="seer"
                type="number"
                value={formData.seer || ''}
                onChange={(e) => setFormData({ ...formData, seer: e.target.value })}
                placeholder="16"
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded">
          {equipment?.brand && <p><strong>Brand:</strong> {equipment.brand}</p>}
          {equipment?.model && <p><strong>Model:</strong> {equipment.model}</p>}
          {equipment?.tonnage && <p><strong>Tonnage:</strong> {equipment.tonnage}</p>}
          {equipment?.seer && <p><strong>SEER:</strong> {equipment.seer}</p>}
          {equipment?.price && <p><strong>Price:</strong> ${Number(equipment.price).toFixed(2)}</p>}
        </div>
      )}
    </div>
  )
}
