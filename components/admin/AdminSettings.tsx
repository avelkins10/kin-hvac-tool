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
import { PriceBookProvider } from "@/src/contexts/PriceBookContext"
import { MaintenanceProvider } from "@/src/contexts/MaintenanceContext"
import { IncentivesProvider } from "@/src/contexts/IncentivesContext"
import { usePriceBook } from "@/src/contexts/PriceBookContext"
import {
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
  TrendingUp,
  Eye,
  Building2,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { CompanySettings } from "./CompanySettings"
import { HVACSystemsManager } from "./HVACSystemsManager"
import { AddOnsManager } from "./AddOnsManager"
import { MaintenancePlansManager } from "./MaintenancePlansManager"
import { IncentivesManager } from "./IncentivesManager"
import { FinancingOptionsManager } from "./FinancingOptionsManager"
import { PriceBookManager } from "./PriceBookManager"

function AdminSettingsContent() {
  const {
    priceBook,
    updateSettings,
  } = usePriceBook()

  const [activeTab, setActiveTab] = useState("company")
  const [priceBookSubTab, setPriceBookSubTab] = useState("units")

  // Export all data
  const handleExport = () => {
    // This would export all admin data
    toast.info("Export functionality coming soon")
  }

  // Import data
  const handleImport = () => {
    toast.info("Import functionality coming soon")
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Admin Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
            <p className="text-gray-500 mt-1">Manage company configuration, pricing, and system settings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Margin Visibility */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Margin Visibility</h3>
                <p className="text-sm text-gray-500">Show margins in proposals</p>
              </div>
            </div>
            <Switch
              checked={priceBook.settings.marginVisible}
              onCheckedChange={(v) => updateSettings({ marginVisible: v })}
            />
          </CardContent>
        </Card>

        {/* Cash Price Markup */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Cash Price Markup</h3>
                <p className="text-sm text-gray-500">Default markup percentage</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={priceBook.settings.cashMarkup}
                onChange={(e) => updateSettings({ cashMarkup: Number(e.target.value) })}
                className="w-20 text-center"
              />
              <span className="text-sm text-gray-500">%</span>
              <Slider
                value={[priceBook.settings.cashMarkup]}
                onValueChange={([v]) => updateSettings({ cashMarkup: v })}
                min={0}
                max={50}
                step={1}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1 bg-white border mb-6">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company
          </TabsTrigger>
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
          <TabsTrigger value="financing" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Financing
          </TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company" className="mt-6">
          <CompanySettings />
        </TabsContent>

        {/* Price Book Tab */}
        <TabsContent value="pricebook" className="mt-6">
          <PriceBookManager 
            activeSubTab={priceBookSubTab} 
            onSubTabChange={setPriceBookSubTab}
          />
        </TabsContent>

        {/* HVAC Systems Tab */}
        <TabsContent value="hvac" className="mt-6">
          <HVACSystemsManager />
        </TabsContent>

        {/* Add-Ons Tab */}
        <TabsContent value="addons" className="mt-6">
          <AddOnsManager />
        </TabsContent>

        {/* Maintenance Plans Tab */}
        <TabsContent value="maintenance" className="mt-6">
          <MaintenancePlansManager />
        </TabsContent>

        {/* Incentives Tab */}
        <TabsContent value="incentives" className="mt-6">
          <IncentivesManager />
        </TabsContent>

        {/* Financing Options Tab */}
        <TabsContent value="financing" className="mt-6">
          <FinancingOptionsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function AdminSettings() {
  return (
    <PriceBookProvider>
      <MaintenanceProvider>
        <IncentivesProvider>
          <AdminSettingsContent />
        </IncentivesProvider>
      </MaintenanceProvider>
    </PriceBookProvider>
  )
}
