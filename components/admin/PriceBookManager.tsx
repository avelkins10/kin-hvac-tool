"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePriceBook } from "@/src/contexts/PriceBookContext"
import { Wind, Wrench, FileText, Package, DollarSign, Plus, Trash2, Pencil, Check } from "lucide-react"

interface PriceBookManagerProps {
  activeSubTab: string
  onSubTabChange: (tab: string) => void
}

export function PriceBookManager({ activeSubTab, onSubTabChange }: PriceBookManagerProps) {
  const {
    priceBook,
    updateUnit,
    addUnit,
    deleteUnit,
    calculateUnitTotalCost,
    updateLaborRate,
    addLaborRate,
    deleteLaborRate,
    setDefaultLaborRate,
    updatePermitFee,
    updateMaterial,
    addMaterial,
    deleteMaterial,
  } = usePriceBook()

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
                onClick={() =>
                  addUnit({
                    name: "New Unit",
                    tier: "good",
                    tonnage: 2,
                    equipmentCost: 2500,
                    installLaborHours: 8,
                    seerRating: 16,
                    brand: "Goodman",
                    modelNumber: "GSX160241",
                    leadTimeDays: 3,
                    systemType: "Air Conditioner",
                  })
                }
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
                        <Button variant="ghost" size="icon">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteUnit(unit.id)}>
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
                onClick={() => addLaborRate({ name: "New Rate", description: "", rate: 100, isDefault: false })}
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
                      <Button variant="ghost" size="icon">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteLaborRate(rate.id)}>
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
            </div>

            <div className="space-y-4">
              {priceBook.permitFees.map((permit) => (
                <div key={permit.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{permit.jurisdiction}</h4>
                      <p className="text-sm text-gray-500">{permit.description}</p>
                      <p className="text-lg font-bold text-green-600 mt-1">${permit.fee}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Pencil className="w-4 h-4" />
                    </Button>
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
                onClick={() => addMaterial({ name: "New Material", description: "", unitCost: 0, unit: "each" })}
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
                        ${material.unitCost}/{material.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMaterial(material.id)}>
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
    </Card>
  )
}
