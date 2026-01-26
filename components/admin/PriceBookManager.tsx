"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePriceBook, type PriceBookUnit, type LaborRate, type PermitFee, type Material } from "@/src/contexts/PriceBookContext"
import { Wind, Wrench, FileText, Package, Plus, Trash2, Pencil, Check, Save, X } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PriceBookManagerProps {
  activeSubTab: string
  onSubTabChange: (tab: string) => void
}

export function PriceBookManager({ activeSubTab, onSubTabChange }: PriceBookManagerProps) {
  const {
    priceBook,
    calculateUnitTotalCost,
    setDefaultLaborRate,
    refreshPriceBook,
  } = usePriceBook()

  // Units state
  const [unitDialogOpen, setUnitDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<PriceBookUnit | null>(null)
  const [unitFormData, setUnitFormData] = useState({
    brand: '',
    modelNumber: '',
    tier: 'good' as 'good' | 'better' | 'best',
    tonnage: '',
    equipmentCost: '',
    installLaborHours: '',
    seerRating: '',
    leadTimeDays: '',
    systemType: '',
  })

  // Labor state
  const [laborDialogOpen, setLaborDialogOpen] = useState(false)
  const [editingLabor, setEditingLabor] = useState<LaborRate | null>(null)
  const [laborFormData, setLaborFormData] = useState({
    name: '',
    description: '',
    rate: '',
  })

  // Permit state
  const [permitDialogOpen, setPermitDialogOpen] = useState(false)
  const [editingPermit, setEditingPermit] = useState<PermitFee | null>(null)
  const [permitFormData, setPermitFormData] = useState({
    name: '',
    tonnageRange: '',
    fee: '',
  })

  // Material state
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [materialFormData, setMaterialFormData] = useState({
    name: '',
    description: '',
    unitCost: '',
    unit: '',
  })

  // Units handlers
  const handleEditUnit = (unit: PriceBookUnit) => {
    setEditingUnit(unit)
    setUnitFormData({
      brand: unit.brand,
      modelNumber: unit.modelNumber,
      tier: unit.tier,
      tonnage: unit.tonnage.toString(),
      equipmentCost: unit.equipmentCost.toString(),
      installLaborHours: unit.installLaborHours.toString(),
      seerRating: unit.seerRating.toString(),
      leadTimeDays: unit.leadTimeDays.toString(),
      systemType: unit.systemType,
    })
    setUnitDialogOpen(true)
  }

  const handleSaveUnit = async () => {
    try {
      const url = editingUnit?.id
        ? `/api/company/pricebook/${editingUnit.id}`
        : '/api/company/pricebook'
      const method = editingUnit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: unitFormData.brand,
          model: unitFormData.modelNumber,
          tonnage: Number(unitFormData.tonnage) || null,
          tier: unitFormData.tier,
          baseCost: Number(unitFormData.equipmentCost),
        }),
      })

      if (response.ok) {
        toast.success(editingUnit ? 'Unit updated' : 'Unit added')
        setUnitDialogOpen(false)
        await refreshPriceBook()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save unit')
      }
    } catch (error) {
      console.error('Error saving unit:', error)
      toast.error('Failed to save unit')
    }
  }

  // Labor handlers
  const handleEditLabor = (rate: LaborRate) => {
    setEditingLabor(rate)
    setLaborFormData({
      name: rate.name,
      description: rate.description,
      rate: rate.rate.toString(),
    })
    setLaborDialogOpen(true)
  }

  const handleSaveLabor = async () => {
    try {
      const url = editingLabor?.id
        ? `/api/company/labor-rates/${editingLabor.id}`
        : '/api/company/labor-rates'
      const method = editingLabor ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: laborFormData.name,
          rate: Number(laborFormData.rate),
        }),
      })

      if (response.ok) {
        toast.success(editingLabor ? 'Labor rate updated' : 'Labor rate added')
        setLaborDialogOpen(false)
        await refreshPriceBook()
      } else {
        toast.error('Failed to save labor rate')
      }
    } catch (error) {
      toast.error('Failed to save labor rate')
    }
  }

  // Permit handlers
  const handleEditPermit = (permit: PermitFee) => {
    setEditingPermit(permit)
    setPermitFormData({
      name: permit.name,
      tonnageRange: permit.tonnageRange,
      fee: permit.fee.toString(),
    })
    setPermitDialogOpen(true)
  }

  const handleSavePermit = async () => {
    try {
      const url = editingPermit?.id
        ? `/api/company/permits/${editingPermit.id}`
        : '/api/company/permits'
      const method = editingPermit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: permitFormData.name,
          cost: Number(permitFormData.fee),
        }),
      })

      if (response.ok) {
        toast.success(editingPermit ? 'Permit fee updated' : 'Permit fee added')
        setPermitDialogOpen(false)
        await refreshPriceBook()
      } else {
        toast.error('Failed to save permit fee')
      }
    } catch (error) {
      toast.error('Failed to save permit fee')
    }
  }

  // Material handlers
  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material)
    setMaterialFormData({
      name: material.name,
      description: material.description,
      unitCost: material.costPerUnit.toString(),
      unit: material.unit,
    })
    setMaterialDialogOpen(true)
  }

  const handleSaveMaterial = async () => {
    try {
      const url = editingMaterial?.id
        ? `/api/company/materials/${editingMaterial.id}`
        : '/api/company/materials'
      const method = editingMaterial ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: materialFormData.name,
          cost: Number(materialFormData.unitCost),
          unit: materialFormData.unit,
        }),
      })

      if (response.ok) {
        toast.success(editingMaterial ? 'Material updated' : 'Material added')
        setMaterialDialogOpen(false)
        await refreshPriceBook()
      } else {
        toast.error('Failed to save material')
      }
    } catch (error) {
      toast.error('Failed to save material')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Book Manager</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage HVAC units, labor rates, permits, and materials
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSubTab} onValueChange={onSubTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Wind className="w-4 h-4" />
              Units
            </TabsTrigger>
            <TabsTrigger value="labor" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Labor
            </TabsTrigger>
            <TabsTrigger value="permits" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Permits
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Materials
            </TabsTrigger>
          </TabsList>

          {/* Units Sub-tab */}
          <TabsContent value="units">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">HVAC Units</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingUnit(null)
                  setUnitFormData({
                    brand: '',
                    modelNumber: '',
                    tier: 'good',
                    tonnage: '',
                    equipmentCost: '',
                    installLaborHours: '8',
                    seerRating: '16',
                    leadTimeDays: '3',
                    systemType: 'Air Conditioner',
                  })
                  setUnitDialogOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Unit
              </Button>
            </div>

            <div className="space-y-4">
              {priceBook.units.map((unit) => {
                const costs = calculateUnitTotalCost(unit)
                return (
                  <div key={unit.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">
                          {unit.brand} {unit.modelNumber}
                        </h4>
                        <Badge
                          variant={
                            unit.tier === "best" ? "default" : unit.tier === "better" ? "secondary" : "outline"
                          }
                        >
                          {unit.tier === "best" ? "Best" : unit.tier === "better" ? "Better" : "Good"}
                        </Badge>
                        <Badge variant="outline">{unit.tonnage} Ton</Badge>
                        <Badge variant="outline">{unit.seerRating} SEER</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditUnit(unit)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this unit?')) {
                              try {
                                const response = await fetch(`/api/company/pricebook/${unit.id}`, {
                                  method: 'DELETE',
                                })
                                if (response.ok) {
                                  toast.success('Unit deleted')
                                  await refreshPriceBook()
                                } else {
                                  toast.error('Failed to delete unit')
                                }
                              } catch (error) {
                                toast.error('Failed to delete unit')
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 mb-3">
                      <span>
                        Equipment Cost: <strong>${unit.equipmentCost.toLocaleString()}</strong>
                      </span>
                      <span>
                        Install Hours: <strong>{unit.installLaborHours}h</strong>
                      </span>
                      <span>
                        Lead Time: <strong>{unit.leadTimeDays} days</strong>
                      </span>
                      <span>
                        System Type: <strong>{unit.systemType}</strong>
                      </span>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Estimated Customer Price:</p>
                      <div className="flex flex-wrap gap-x-4 text-sm">
                        <span>
                          Equipment: <strong>${costs.equipment.toLocaleString()}</strong>
                        </span>
                        <span>
                          Labor: <strong>${costs.labor.toLocaleString()}</strong>
                        </span>
                        <span>
                          Permit: <strong>${costs.permit}</strong>
                        </span>
                        <span>
                          Total: <strong className="text-green-600 text-lg">${costs.total.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {/* Labor Sub-tab */}
          <TabsContent value="labor">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Labor Rates</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingLabor(null)
                  setLaborFormData({ name: '', description: '', rate: '' })
                  setLaborDialogOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Labor Rate
              </Button>
            </div>

            <div className="space-y-4">
              {priceBook.laborRates.map((rate) => (
                <div key={rate.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{rate.name}</h4>
                        {rate.isDefault && <Badge className="bg-blue-500">Default</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{rate.description}</p>
                      <p className="text-lg font-bold text-green-600 mt-1">${rate.rate}/hour</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!rate.isDefault && (
                        <Button variant="outline" size="sm" onClick={() => setDefaultLaborRate(rate.id)}>
                          Set Default
                        </Button>
                      )}
                      {rate.isDefault && <Check className="w-5 h-5 text-green-600" />}
                      <Button variant="ghost" size="icon" onClick={() => handleEditLabor(rate)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this labor rate?')) {
                            try {
                              const response = await fetch(`/api/company/labor-rates/${rate.id}`, {
                                method: 'DELETE',
                              })
                              if (response.ok) {
                                toast.success('Labor rate deleted')
                                await refreshPriceBook()
                              } else {
                                toast.error('Failed to delete labor rate')
                              }
                            } catch (error) {
                              toast.error('Failed to delete labor rate')
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Permits Sub-tab */}
          <TabsContent value="permits">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Permit Fees</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingPermit(null)
                  setPermitFormData({ name: '', tonnageRange: '', fee: '' })
                  setPermitDialogOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Permit Fee
              </Button>
            </div>

            <div className="space-y-4">
              {priceBook.permitFees.map((permit) => (
                <div key={permit.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{permit.name}</h4>
                      {permit.tonnageRange && (
                        <p className="text-sm text-gray-500">{permit.tonnageRange}</p>
                      )}
                      <p className="text-lg font-bold text-green-600 mt-1">${permit.fee}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPermit(permit)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this permit fee?')) {
                            try {
                              const response = await fetch(`/api/company/permits/${permit.id}`, {
                                method: 'DELETE',
                              })
                              if (response.ok) {
                                toast.success('Permit fee deleted')
                                await refreshPriceBook()
                              } else {
                                toast.error('Failed to delete permit fee')
                              }
                            } catch (error) {
                              toast.error('Failed to delete permit fee')
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Materials Sub-tab */}
          <TabsContent value="materials">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Materials</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingMaterial(null)
                  setMaterialFormData({ name: '', description: '', unitCost: '', unit: 'each' })
                  setMaterialDialogOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            </div>

            <div className="space-y-4">
              {priceBook.materials.map((material) => (
                <div key={material.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{material.name}</h4>
                      <p className="text-sm text-gray-500">{material.description}</p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        ${material.costPerUnit}/{material.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditMaterial(material)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this material?')) {
                          try {
                            const response = await fetch(`/api/company/materials/${material.id}`, {
                              method: 'DELETE',
                            })
                            if (response.ok) {
                              toast.success('Material deleted')
                              await refreshPriceBook()
                            } else {
                              toast.error('Failed to delete material')
                            }
                          } catch (error) {
                            toast.error('Failed to delete material')
                          }
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Unit Edit Dialog */}
      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add Unit'}</DialogTitle>
            <DialogDescription>Configure HVAC unit details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={unitFormData.brand}
                  onChange={(e) => setUnitFormData({ ...unitFormData, brand: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="modelNumber">Model Number</Label>
                <Input
                  id="modelNumber"
                  value={unitFormData.modelNumber}
                  onChange={(e) => setUnitFormData({ ...unitFormData, modelNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={unitFormData.tier}
                  onValueChange={(v: 'good' | 'better' | 'best') => setUnitFormData({ ...unitFormData, tier: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="better">Better</SelectItem>
                    <SelectItem value="best">Best</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tonnage">Tonnage</Label>
                <Input
                  id="tonnage"
                  type="number"
                  value={unitFormData.tonnage}
                  onChange={(e) => setUnitFormData({ ...unitFormData, tonnage: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipmentCost">Equipment Cost ($)</Label>
                <Input
                  id="equipmentCost"
                  type="number"
                  value={unitFormData.equipmentCost}
                  onChange={(e) => setUnitFormData({ ...unitFormData, equipmentCost: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="installLaborHours">Install Hours</Label>
                <Input
                  id="installLaborHours"
                  type="number"
                  value={unitFormData.installLaborHours}
                  onChange={(e) => setUnitFormData({ ...unitFormData, installLaborHours: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seerRating">SEER Rating</Label>
                <Input
                  id="seerRating"
                  type="number"
                  value={unitFormData.seerRating}
                  onChange={(e) => setUnitFormData({ ...unitFormData, seerRating: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
                <Input
                  id="leadTimeDays"
                  type="number"
                  value={unitFormData.leadTimeDays}
                  onChange={(e) => setUnitFormData({ ...unitFormData, leadTimeDays: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="systemType">System Type</Label>
              <Input
                id="systemType"
                value={unitFormData.systemType}
                onChange={(e) => setUnitFormData({ ...unitFormData, systemType: e.target.value })}
                placeholder="e.g., Air Conditioner, Heat Pump"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveUnit}>
              <Save className="w-4 h-4 mr-2" />
              {editingUnit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Labor Edit Dialog */}
      <Dialog open={laborDialogOpen} onOpenChange={setLaborDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLabor ? 'Edit Labor Rate' : 'Add Labor Rate'}</DialogTitle>
            <DialogDescription>Configure labor rate details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="laborName">Name</Label>
              <Input
                id="laborName"
                value={laborFormData.name}
                onChange={(e) => setLaborFormData({ ...laborFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="laborDescription">Description</Label>
              <Textarea
                id="laborDescription"
                value={laborFormData.description}
                onChange={(e) => setLaborFormData({ ...laborFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="laborRate">Rate per Hour ($)</Label>
              <Input
                id="laborRate"
                type="number"
                value={laborFormData.rate}
                onChange={(e) => setLaborFormData({ ...laborFormData, rate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLaborDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveLabor}>
              <Save className="w-4 h-4 mr-2" />
              {editingLabor ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permit Edit Dialog */}
      <Dialog open={permitDialogOpen} onOpenChange={setPermitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPermit ? 'Edit Permit Fee' : 'Add Permit Fee'}</DialogTitle>
            <DialogDescription>Configure permit fee details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="permitName">Name</Label>
              <Input
                id="permitName"
                value={permitFormData.name}
                onChange={(e) => setPermitFormData({ ...permitFormData, name: e.target.value })}
                placeholder="e.g., Small System, Medium System"
              />
            </div>
            <div>
              <Label htmlFor="tonnageRange">Tonnage Range</Label>
              <Input
                id="tonnageRange"
                value={permitFormData.tonnageRange}
                onChange={(e) => setPermitFormData({ ...permitFormData, tonnageRange: e.target.value })}
                placeholder="e.g., 2-2.5 Ton, 3-3.5 Ton"
              />
            </div>
            <div>
              <Label htmlFor="permitFee">Fee ($)</Label>
              <Input
                id="permitFee"
                type="number"
                value={permitFormData.fee}
                onChange={(e) => setPermitFormData({ ...permitFormData, fee: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermitDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSavePermit}>
              <Save className="w-4 h-4 mr-2" />
              {editingPermit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Edit Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add Material'}</DialogTitle>
            <DialogDescription>Configure material details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="materialName">Name</Label>
              <Input
                id="materialName"
                value={materialFormData.name}
                onChange={(e) => setMaterialFormData({ ...materialFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="materialDescription">Description</Label>
              <Textarea
                id="materialDescription"
                value={materialFormData.description}
                onChange={(e) => setMaterialFormData({ ...materialFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="materialUnitCost">Unit Cost ($)</Label>
                <Input
                  id="materialUnitCost"
                  type="number"
                  value={materialFormData.unitCost}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, unitCost: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="materialUnit">Unit</Label>
                <Input
                  id="materialUnit"
                  value={materialFormData.unit}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, unit: e.target.value })}
                  placeholder="e.g., each, lb, ft"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveMaterial}>
              <Save className="w-4 h-4 mr-2" />
              {editingMaterial ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
