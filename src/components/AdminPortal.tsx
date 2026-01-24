"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { usePriceBook } from "../contexts/PriceBookContext"
import { useMaintenance } from "../contexts/MaintenanceContext"
import { useIncentives } from "../contexts/IncentivesContext"
import {
  X,
  Plus,
  Trash2,
  Pencil,
  DollarSign,
  Wind,
  Package,
  Wrench,
  Gift,
  Calculator,
  FileText,
  CreditCard,
  Download,
  Upload,
  Check,
  TrendingUp,
  Eye,
  Info,
  Percent,
  Calendar,
  CheckCircle2,
  Save,
} from "lucide-react"

interface Props {
  onClose: () => void
}

export function AdminPortal({ onClose }: Props) {
  const {
    priceBook,
    updateHVACSystem,
    addHVACSystem,
    deleteHVACSystem,
    getSystemSalesPrice,
    getSystemGrossProfit,
    getSystemMarkupPercent,
    updateAddOn,
    addAddOn,
    deleteAddOn,
    getAddOnSalesPrice,
    getAddOnGrossProfit,
    getAddOnMarkupPercent,
    updateMaterial,
    addMaterial,
    deleteMaterial,
    updateLaborRate,
    addLaborRate,
    deleteLaborRate,
    setDefaultLaborRate,
    updatePermitFee,
    updateUnit,
    addUnit,
    deleteUnit,
    calculateUnitTotalCost,
    updateFinancingOption,
    addFinancingOption,
    deleteFinancingOption,
    updateSettings,
  } = usePriceBook()

  const {
    plans,
    bundleDiscounts,
    updatePlan,
    addPlan,
    deletePlan,
    updateBundleDiscount,
    getPlanSalesPrice,
    getPlanGrossProfit,
    getPlanMarkupPercent,
    getPlanMonthlyPrice,
    getCostPerVisit,
  } = useMaintenance()

  const { incentives, updateIncentive, addIncentive, deleteIncentive } = useIncentives()

  const [activeTab, setActiveTab] = useState("pricebook")
  const [priceBookSubTab, setPriceBookSubTab] = useState("units")
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null)

  // Export all data
  const handleExport = () => {
    const exportData = {
      priceBook,
      plans,
      bundleDiscounts,
      incentives,
      exportDate: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hvac-pricebook-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import data
  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            JSON.parse(e.target?.result as string)
            alert("Import successful! Please refresh to see changes.")
          } catch {
            alert("Failed to import file")
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">Pricing Management</h1>
            <p className="text-sm text-muted-foreground">
              Configure system pricing, margins, and add-ons for your sales team
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        {/* Margin Visibility */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Margin Visibility</h3>
                <p className="text-sm text-muted-foreground">Control whether margins are visible in sales proposals</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Visible</span>
              <Switch
                checked={priceBook.settings.marginVisible}
                onCheckedChange={(v) => updateSettings({ marginVisible: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cash Price Markup */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Cash Price Markup</h3>
                <p className="text-sm text-muted-foreground">Add percentage markup to cash prices shown to customers</p>
                <p className="text-xs text-orange-600">
                  Current: Base cost × {(1 + priceBook.settings.cashMarkup / 100).toFixed(2)} = Customer sees +
                  {priceBook.settings.cashMarkup}% marked up cash price
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={priceBook.settings.cashMarkup}
                onChange={(e) => updateSettings({ cashMarkup: Number(e.target.value) })}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Slider
                value={[priceBook.settings.cashMarkup]}
                onValueChange={([v]) => updateSettings({ cashMarkup: v })}
                min={0}
                max={50}
                step={1}
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1 bg-white border">
            <TabsTrigger value="pricebook" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price Book
            </TabsTrigger>
            <TabsTrigger value="hvac" className="flex items-center gap-2">
              <Wind className="w-4 h-4" />
              HVAC Systems
            </TabsTrigger>
            <TabsTrigger value="addons" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add-Ons
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="incentives" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Incentives
            </TabsTrigger>
            <TabsTrigger value="sizing" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Sizing
            </TabsTrigger>
            <TabsTrigger value="avl" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              AVL
            </TabsTrigger>
            <TabsTrigger value="financing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Financing
            </TabsTrigger>
          </TabsList>

          {/* PRICE BOOK TAB */}
          <TabsContent value="pricebook" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>Price Book Manager</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage HVAC units, labor rates, permits, and materials
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleImport}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={priceBookSubTab} onValueChange={setPriceBookSubTab}>
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
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  {/* Units Sub-tab */}
                  <TabsContent value="units">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">HVAC Units</h3>
                      <Button
                        size="sm"
                        className="bg-lime-400 hover:bg-lime-500 text-black"
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

                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground mb-3">
                              <span>
                                Equipment Cost:{" "}
                                <strong className="text-foreground">${unit.equipmentCost.toLocaleString()}</strong>
                              </span>
                              <span>
                                Install Hours: <strong className="text-foreground">{unit.installLaborHours}h</strong>
                              </span>
                              <span>
                                Lead Time: <strong className="text-foreground">{unit.leadTimeDays} days</strong>
                              </span>
                              <span>
                                System Type: <strong className="text-foreground">{unit.systemType}</strong>
                              </span>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground mb-1">Estimated Customer Price:</p>
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
                                  Total:{" "}
                                  <strong className="text-green-600 text-lg">${costs.total.toLocaleString()}</strong>
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
                        className="bg-lime-400 hover:bg-lime-500 text-black"
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
                              <p className="text-sm text-muted-foreground">{rate.description}</p>
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
                        <div
                          key={permit.id}
                          className="border rounded-lg p-4 bg-white flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-semibold">{permit.name}</h4>
                            <p className="text-sm text-muted-foreground">{permit.tonnageRange}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Input
                              type="number"
                              value={permit.fee}
                              onChange={(e) => updatePermitFee({ ...permit, fee: Number(e.target.value) })}
                              className="w-24"
                            />
                            <span className="text-muted-foreground">$</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Materials Sub-tab */}
                  <TabsContent value="materials">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Materials Library</h3>
                      <Button
                        size="sm"
                        className="bg-lime-400 hover:bg-lime-500 text-black"
                        onClick={() =>
                          addMaterial({
                            name: "New Material",
                            category: "General",
                            description: "",
                            costPerUnit: 0,
                            unit: "each",
                            defaultQty: 1,
                          })
                        }
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Material
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {priceBook.materials.map((material) => (
                        <div key={material.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{material.name}</h4>
                              <Badge variant="outline">{material.category}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMaterial(material.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{material.description}</p>
                          <div className="flex gap-4 text-sm">
                            <span>
                              Cost:{" "}
                              <strong className="text-green-600">
                                ${material.costPerUnit}/{material.unit}
                              </strong>
                            </span>
                            <span>
                              Default Qty: <strong>{material.defaultQty}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Settings Sub-tab */}
                  <TabsContent value="settings">
                    <Card>
                      <CardHeader>
                        <CardTitle>Pricing Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label>Overhead Multiplier</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={priceBook.settings.overheadMultiplier}
                              onChange={(e) => updateSettings({ overheadMultiplier: Number(e.target.value) })}
                              className="w-24"
                            />
                            <span className="text-muted-foreground">
                              ({Math.round((priceBook.settings.overheadMultiplier - 1) * 100)}% overhead)
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Multiplier applied to cover business overhead costs
                          </p>
                        </div>

                        <div>
                          <Label>Profit Margin (%)</Label>
                          <Input
                            type="number"
                            value={priceBook.settings.profitMargin}
                            onChange={(e) => updateSettings({ profitMargin: Number(e.target.value) })}
                            className="w-24 mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Profit percentage added to final price</p>
                        </div>

                        <div>
                          <Label>Tax Rate (%)</Label>
                          <Input
                            type="number"
                            value={priceBook.settings.taxRate}
                            onChange={(e) => updateSettings({ taxRate: Number(e.target.value) })}
                            className="w-24 mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Sales tax rate (typically 0 for labor-based services)
                          </p>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="font-semibold mb-2">Pricing Formula</h4>
                          <div className="font-mono text-sm space-y-1">
                            <p>
                              Equipment Cost + Labor Cost + Permit Cost + Materials = <strong>Subtotal</strong>
                            </p>
                            <p>
                              Subtotal × {priceBook.settings.overheadMultiplier} = <strong>With Overhead</strong>
                            </p>
                            <p>
                              With Overhead × (1 + {priceBook.settings.profitMargin}%) ={" "}
                              <strong className="text-green-600">Final Price</strong>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HVAC SYSTEMS TAB */}
          <TabsContent value="hvac" className="mt-4 space-y-4">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    HVAC Systems vs Price Book
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>HVAC Systems</strong> (this tab) = Simple markup pricing used in customer proposals{" "}
                    <CheckCircle2 className="w-4 h-4 inline text-green-500" />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Price Book</strong> (other tab) = Detailed cost builder for job costing{" "}
                    <Calculator className="w-4 h-4 inline text-blue-500" /> (not connected yet)
                  </p>
                  <p className="text-xs text-blue-600 mt-2 bg-blue-100 px-2 py-1 rounded inline-block">
                    💡 Tip: Set your "Base Cost" here to your true all-in cost (equipment + labor + materials + permits)
                  </p>
                </div>
              </div>
            </div>

            {/* HVAC Systems */}
            {priceBook.hvacSystems.map((system) => {
              const salesPrice = getSystemSalesPrice(system)
              const grossProfit = getSystemGrossProfit(system)
              const markupPercent = getSystemMarkupPercent(system)
              const isEditing = editingSystemId === system.id

              return (
                <Card key={system.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{system.name}</h3>
                          <Badge
                            className={
                              system.tier === "best"
                                ? "bg-purple-600"
                                : system.tier === "better"
                                  ? "bg-green-600"
                                  : "bg-gray-600"
                            }
                          >
                            {system.tier === "best" ? "BEST" : system.tier === "better" ? "BETTER" : "GOOD"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{system.description}</p>
                      </div>
                      <Button variant="outline" onClick={() => setEditingSystemId(isEditing ? null : system.id)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Base Cost */}
                      <div>
                        <Label className="text-sm font-medium">Base Cost (Your Cost)</Label>
                        <Input
                          type="number"
                          value={system.baseCost}
                          onChange={(e) => updateHVACSystem({ ...system, baseCost: Number(e.target.value) })}
                          className="mt-2"
                        />

                        <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-blue-600">Margin ({system.marginType === "fixed" ? "$" : "%"})</span>
                            <span className="font-semibold text-blue-600">
                              {system.marginType === "fixed"
                                ? `$${grossProfit.toLocaleString()}`
                                : `${system.marginAmount}%`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sales Price</span>
                            <div className="text-right">
                              <span className="font-bold text-green-600 text-xl">${salesPrice.toLocaleString()}</span>
                              <p className="text-xs text-muted-foreground">{markupPercent}% markup</p>
                            </div>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span>Gross Profit</span>
                            <span className="font-bold text-green-600">${grossProfit.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Margin Controls */}
                      <div>
                        <Label className="text-sm font-medium">Margin Type</Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant={system.marginType === "fixed" ? "default" : "outline"}
                            className={system.marginType === "fixed" ? "bg-gray-900" : ""}
                            onClick={() => updateHVACSystem({ ...system, marginType: "fixed" })}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Fixed
                          </Button>
                          <Button
                            variant={system.marginType === "percentage" ? "default" : "outline"}
                            className={system.marginType === "percentage" ? "bg-gray-900" : ""}
                            onClick={() => updateHVACSystem({ ...system, marginType: "percentage" })}
                          >
                            <Percent className="w-4 h-4 mr-1" />
                            Percentage
                          </Button>
                        </div>

                        <div className="mt-4">
                          <Label className="text-sm font-medium">Adjust Margin</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <Slider
                              value={[system.marginAmount]}
                              onValueChange={([v]) => updateHVACSystem({ ...system, marginAmount: v })}
                              min={0}
                              max={system.marginType === "fixed" ? 10000 : 100}
                              step={system.marginType === "fixed" ? 100 : 1}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={system.marginAmount}
                              onChange={(e) => updateHVACSystem({ ...system, marginAmount: Number(e.target.value) })}
                              className="w-24"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0</span>
                            <span>{system.marginType === "fixed" ? "$10,000" : "100%"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {system.features.slice(0, 4).map((feature, i) => (
                          <Badge key={i} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                        {system.features.length > 4 && (
                          <Badge variant="outline">+{system.features.length - 4} more</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Add New System */}
            <button
              onClick={() =>
                addHVACSystem({
                  name: "New System",
                  tier: "good",
                  description: "New HVAC System",
                  baseCost: 8000,
                  marginType: "fixed",
                  marginAmount: 2000,
                  features: [],
                  enabled: true,
                })
              }
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-muted-foreground hover:border-gray-400 hover:text-foreground transition-colors"
            >
              <Plus className="w-5 h-5 mx-auto mb-2" />
              Add New System
            </button>

            <div className="flex justify-end">
              <Button className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
            </div>
          </TabsContent>

          {/* ADD-ONS TAB */}
          <TabsContent value="addons" className="mt-4 space-y-4">
            {priceBook.addOns.map((addon) => {
              const salesPrice = getAddOnSalesPrice(addon)
              const grossProfit = getAddOnGrossProfit(addon)
              const markupPercent = getAddOnMarkupPercent(addon)

              return (
                <Card key={addon.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{addon.name}</h3>
                        <p className="text-muted-foreground text-sm">{addon.description}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteAddOn(addon.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Base Cost */}
                      <div>
                        <Label className="text-sm font-medium">Base Cost (Your Cost)</Label>
                        <Input
                          type="number"
                          value={addon.baseCost}
                          onChange={(e) => updateAddOn({ ...addon, baseCost: Number(e.target.value) })}
                          className="mt-2"
                        />

                        <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-blue-600">Margin ($)</span>
                            <span className="font-semibold text-blue-600">${grossProfit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sales Price</span>
                            <div className="text-right">
                              <span className="font-bold text-green-600">${salesPrice}</span>
                              <p className="text-xs text-muted-foreground">{markupPercent}% markup</p>
                            </div>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span>Gross Profit</span>
                            <span className="font-bold text-green-600">${grossProfit}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Margin Controls */}
                      <div>
                        <Label className="text-sm font-medium">Margin Type</Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant={addon.marginType === "fixed" ? "default" : "outline"}
                            className={addon.marginType === "fixed" ? "bg-gray-900" : ""}
                            onClick={() => updateAddOn({ ...addon, marginType: "fixed" })}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Fixed
                          </Button>
                          <Button
                            variant={addon.marginType === "percentage" ? "default" : "outline"}
                            className={addon.marginType === "percentage" ? "bg-gray-900" : ""}
                            onClick={() => updateAddOn({ ...addon, marginType: "percentage" })}
                          >
                            <Percent className="w-4 h-4 mr-1" />
                            Percentage
                          </Button>
                        </div>

                        <div className="mt-4">
                          <Label className="text-sm font-medium">Adjust Margin</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <Slider
                              value={[addon.marginAmount]}
                              onValueChange={([v]) => updateAddOn({ ...addon, marginAmount: v })}
                              min={0}
                              max={2000}
                              step={25}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={addon.marginAmount}
                              onChange={(e) => updateAddOn({ ...addon, marginAmount: Number(e.target.value) })}
                              className="w-24"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0</span>
                            <span>$2,000</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Add New Add-On */}
            <button
              onClick={() =>
                addAddOn({
                  name: "New Add-On",
                  description: "Description",
                  baseCost: 200,
                  marginType: "fixed",
                  marginAmount: 100,
                  enabled: true,
                })
              }
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-muted-foreground hover:border-gray-400 hover:text-foreground transition-colors"
            >
              <Plus className="w-5 h-5 mx-auto mb-2" />
              Add New Add-On
            </button>

            <div className="flex justify-end">
              <Button className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
            </div>
          </TabsContent>

          {/* MAINTENANCE TAB */}
          <TabsContent value="maintenance" className="mt-4 space-y-4">
            {/* Benefits Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Maintenance Plan Benefits</h4>
                  <div className="text-sm text-muted-foreground space-y-1 mt-1">
                    <p>
                      ✅ <strong>Recurring Revenue:</strong> Annual/quarterly billing creates predictable income
                    </p>
                    <p>
                      ✅ <strong>Customer Retention:</strong> Plans keep customers engaged year-round
                    </p>
                    <p>
                      ✅ <strong>Upsell Opportunities:</strong> Regular visits lead to equipment upgrades
                    </p>
                    <p>
                      ✅ <strong>Preventive Care:</strong> Fewer emergency calls, happier customers
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Year Bundle Discounts */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Percent className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Multi-Year Bundle Discounts</h4>
                    <p className="text-sm text-muted-foreground">
                      Incentivize customers to commit to longer terms with prepayment discounts. These discounts apply
                      when customers prepay for 3, 5, or 7 years upfront.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bundleDiscounts.map((bundle) => (
                    <div key={bundle.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{bundle.label}</span>
                        {bundle.badge && (
                          <Badge className={bundle.badge === "Best Value" ? "bg-green-600" : "bg-blue-600"}>
                            {bundle.badge}
                          </Badge>
                        )}
                      </div>
                      <Label className="text-xs">Discount Percentage</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          value={bundle.discountPercent}
                          onChange={(e) => updateBundleDiscount({ ...bundle, discountPercent: Number(e.target.value) })}
                          className="w-20"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                        <p className="text-muted-foreground">Example:</p>
                        <p>$1,000/year plan:</p>
                        <p className="text-blue-600">
                          {bundle.years} years × $1,000 = ${(bundle.years * 1000).toLocaleString()}
                        </p>
                        <p>Discount: ${Math.round((bundle.years * 1000 * bundle.discountPercent) / 100)}</p>
                        <p className="font-semibold text-green-600">
                          Customer pays: ${(bundle.years * 1000 * (1 - bundle.discountPercent / 100)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-muted-foreground">
                    <strong>Pro Tip:</strong> These discounts make maintenance more affordable while securing long-term
                    customer commitments. The bundles can be included in the total financed amount, making monthly
                    payments even more attractive.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Plans */}
            {plans.map((plan) => {
              const salesPrice = getPlanSalesPrice(plan)
              const grossProfit = getPlanGrossProfit(plan)
              const markupPercent = getPlanMarkupPercent(plan)
              const monthlyPrice = getPlanMonthlyPrice(plan)
              const costPerVisit = getCostPerVisit(plan)

              return (
                <Card key={plan.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${plan.tier === "premium" ? "bg-purple-600" : plan.tier === "standard" ? "bg-blue-600" : "bg-gray-600"}`}
                        />
                        <div>
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <Badge
                            className={
                              plan.tier === "premium"
                                ? "bg-purple-600"
                                : plan.tier === "standard"
                                  ? "bg-blue-600"
                                  : "bg-gray-600"
                            }
                          >
                            {plan.tier.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Enabled</span>
                        <Switch checked={plan.enabled} onCheckedChange={(v) => updatePlan({ ...plan, enabled: v })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Plan Description & Costs */}
                      <div className="lg:col-span-2">
                        <Label className="text-sm font-medium">Plan Description</Label>
                        <Textarea
                          value={plan.description}
                          onChange={(e) => updatePlan({ ...plan, description: e.target.value })}
                          className="mt-2"
                        />

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label className="text-sm font-medium">Base Cost (Your Cost)</Label>
                            <Input
                              type="number"
                              value={plan.baseCost}
                              onChange={(e) => updatePlan({ ...plan, baseCost: Number(e.target.value) })}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Visits Per Year</Label>
                            <Input
                              type="number"
                              value={plan.visitsPerYear}
                              onChange={(e) => updatePlan({ ...plan, visitsPerYear: Number(e.target.value) })}
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <Label className="text-sm font-medium">Margin Type</Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant={plan.marginType === "fixed" ? "default" : "outline"}
                              className={plan.marginType === "fixed" ? "bg-gray-900" : ""}
                              onClick={() => updatePlan({ ...plan, marginType: "fixed" })}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Fixed
                            </Button>
                            <Button
                              variant={plan.marginType === "percentage" ? "default" : "outline"}
                              className={plan.marginType === "percentage" ? "bg-blue-600" : ""}
                              onClick={() => updatePlan({ ...plan, marginType: "percentage" })}
                            >
                              <Percent className="w-4 h-4 mr-1" />
                              Percentage
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[plan.marginAmount]}
                              onValueChange={([v]) => updatePlan({ ...plan, marginAmount: v })}
                              min={0}
                              max={plan.marginType === "fixed" ? 500 : 200}
                              step={plan.marginType === "fixed" ? 10 : 5}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={plan.marginAmount}
                              onChange={(e) => updatePlan({ ...plan, marginAmount: Number(e.target.value) })}
                              className="w-20"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0</span>
                            <span>{plan.marginType === "fixed" ? "$500" : "200%"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Pricing Summary */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">Pricing</span>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Customer Pays</p>
                            <p className="text-2xl font-bold text-green-600">${salesPrice.toLocaleString()}/year</p>
                            <p className="text-sm text-muted-foreground">or ${monthlyPrice}/month</p>
                          </div>

                          <div className="border-t pt-3 space-y-2 text-sm">
                            <p className="font-semibold">Breakdown</p>
                            <div className="flex justify-between">
                              <span>Base Cost:</span>
                              <span>${plan.baseCost}</span>
                            </div>
                            <div className="flex justify-between text-blue-600">
                              <span>Margin:</span>
                              <span>
                                {plan.marginType === "percentage" ? `${plan.marginAmount}%` : `$${plan.marginAmount}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sales Price:</span>
                              <div className="text-right">
                                <span className="text-green-600 font-semibold">${salesPrice}</span>
                                <p className="text-xs text-muted-foreground">{markupPercent}% markup</p>
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-3 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">Service Details</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Visits/Year:</span>
                              <span>{plan.visitsPerYear}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cost/Visit:</span>
                              <span>${costPerVisit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Features:</span>
                              <span>{plan.features.length} items</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mt-6 pt-4 border-t">
                      <p className="text-sm font-semibold mb-3">What's Included ({plan.features.length} features)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <div className="flex justify-end">
              <Button className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save Maintenance Plans
              </Button>
            </div>
          </TabsContent>

          {/* INCENTIVES TAB */}
          <TabsContent value="incentives" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Available Incentives</h3>
              <Button
                size="sm"
                className="bg-lime-400 hover:bg-lime-500 text-black"
                onClick={() =>
                  addIncentive({
                    name: "New Incentive",
                    amount: 500,
                    type: "rebate",
                    description: "",
                    requirements: [],
                    available: true,
                  })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Incentive
              </Button>
            </div>

            {incentives.map((incentive) => (
              <Card key={incentive.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{incentive.name}</h4>
                        <Badge
                          variant={
                            incentive.type === "tax_credit"
                              ? "default"
                              : incentive.type === "rebate"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {incentive.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{incentive.description}</p>
                      <p className="text-xl font-bold text-green-600">${incentive.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={incentive.available}
                        onCheckedChange={(v) => updateIncentive({ ...incentive, available: v })}
                      />
                      <Button variant="ghost" size="icon" onClick={() => deleteIncentive(incentive.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* SIZING TAB */}
          <TabsContent value="sizing" className="mt-4">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-foreground mb-2">Sizing Calculator</h3>
                <p>Coming soon - Configure Manual J calculation parameters and sizing rules</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AVL TAB */}
          <TabsContent value="avl" className="mt-4">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-foreground mb-2">Approved Vendor List</h3>
                <p>Coming soon - Manage approved equipment and vendor relationships</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FINANCING TAB */}
          <TabsContent value="financing" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Financing Options</h3>
              <Button
                size="sm"
                className="bg-lime-400 hover:bg-lime-500 text-black"
                onClick={() =>
                  addFinancingOption({
                    name: "New Option",
                    type: "finance",
                    termMonths: 60,
                    apr: 9.99,
                    dealerFee: 5,
                    description: "",
                    available: true,
                  })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>

            {/* Group by type */}
            {(["cash", "finance", "lease"] as const).map((type) => {
              const options = priceBook.financingOptions.filter((o) => o.type === type)
              if (options.length === 0) return null

              return (
                <div key={type}>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase">{type} Options</h4>
                  <div className="space-y-3">
                    {options.map((option) => (
                      <Card key={option.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{option.name}</h4>
                                {option.provider && <Badge variant="outline">{option.provider}</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                              <div className="flex gap-4 mt-2 text-sm">
                                {option.termMonths > 0 && (
                                  <span>
                                    Term: <strong>{option.termMonths} months</strong>
                                  </span>
                                )}
                                {option.apr > 0 && (
                                  <span>
                                    APR: <strong>{option.apr}%</strong>
                                  </span>
                                )}
                                {option.dealerFee > 0 && (
                                  <span>
                                    Dealer Fee: <strong>{option.dealerFee}%</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={option.available}
                                onCheckedChange={(v) => updateFinancingOption({ ...option, available: v })}
                              />
                              <Button variant="ghost" size="icon" onClick={() => deleteFinancingOption(option.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
