"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Save,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type {
  HVACSystemCategory,
  HVACEquipmentType,
  HVACManufacturer,
  HVACInstallPackage,
  HVACEquipmentItem,
} from "@/lib/integrations/lightreach";

interface InstallPackageFormProps {
  accountId: string;
  proposalId: string;
  initialData?: Partial<HVACInstallPackage>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const systemCategories: HVACSystemCategory[] = [
  "Heat Pump Split System",
  "Conventional Ducted Split System",
  "Conventional Ducted System",
  "Air Conditioning/Air Handler Split System",
  "Gas Conventional Split System",
  "Dual Fuel Split System",
  "Packaged Heat Pump",
  "Packaged Gas/Electric",
  "Packaged Dual Fuel",
  "Single Zone Mini Split",
  "Multi Zone Mini Split",
  "Ductless Mini Split",
  "Ducted Mini Split",
  "Package",
];

const equipmentTypes: HVACEquipmentType[] = [
  "heatPump",
  "airHandler",
  "airConditioner",
  "furnace",
  "heatStrip",
  "evaporatorCoil",
  "ductlessOutdoor",
  "ductlessIndoor",
  "packagedAC",
  "packagedHeatPump",
  "packagedGasAC",
  "packagedDualFuel",
  "other",
];

const manufacturers: HVACManufacturer[] = [
  "Carrier",
  "Trane",
  "Lennox",
  "Goodman",
  "Rheem",
  "Daikin",
  "Bryant",
  "American Standard",
  "Mitsubishi Electric",
  "LG",
  "York",
  "Bosch",
  "Fujitsu",
  "Amana",
  "Samsung",
  "Gree",
  "Run-Tru",
  "Ameristar",
];

const defaultEquipmentItem: HVACEquipmentItem = {
  type: "heatPump",
  name: "",
  manufacturer: "Carrier",
  model: "",
  quantity: 1,
  serialNumbers: [""],
  size: { unit: "ton", value: "" },
  efficiencies: [{ unit: "SEER2", value: "" }],
};

export function InstallPackageForm({
  accountId,
  proposalId,
  initialData,
  onSuccess,
  onCancel,
}: InstallPackageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [flags, setFlags] = useState<any[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);

  // Form state
  const [systemCategory, setSystemCategory] = useState<HVACSystemCategory>(
    initialData?.systemDesign?.systems?.[0]?.systemCategory ||
      "Heat Pump Split System",
  );
  const [conditionedArea, setConditionedArea] = useState(
    initialData?.systemDesign?.systems?.[0]?.conditionedArea?.toString() || "",
  );
  const [ahriNumber, setAhriNumber] = useState(
    initialData?.systemDesign?.systems?.[0]?.ahriNumber || "",
  );
  const [installDate, setInstallDate] = useState("");
  const [equipmentItems, setEquipmentItems] = useState<HVACEquipmentItem[]>(
    initialData?.systemDesign?.systems?.[0]?.equipment?.items || [
      { ...defaultEquipmentItem },
    ],
  );
  const [permitAttestation, setPermitAttestation] = useState(false);
  const [attestationText, setAttestationText] = useState("");

  // Load existing flags
  useEffect(() => {
    async function loadFlags() {
      try {
        const res = await fetch(
          `/api/finance/lightreach/install-package/${accountId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setFlags(data.flags || []);
        }
      } catch (err) {
        console.warn("Failed to load install package flags:", err);
      } finally {
        setFlagsLoading(false);
      }
    }
    if (accountId && !accountId.startsWith("test_")) {
      loadFlags();
    } else {
      setFlagsLoading(false);
    }
  }, [accountId]);

  const addEquipmentItem = () => {
    setEquipmentItems([...equipmentItems, { ...defaultEquipmentItem }]);
  };

  const removeEquipmentItem = (index: number) => {
    if (equipmentItems.length > 1) {
      setEquipmentItems(equipmentItems.filter((_, i) => i !== index));
    }
  };

  const updateEquipmentItem = (index: number, field: string, value: any) => {
    const updated = [...equipmentItems];
    if (field === "serialNumbers") {
      updated[index] = { ...updated[index], serialNumbers: value };
    } else if (field === "size.value") {
      updated[index] = {
        ...updated[index],
        size: { ...updated[index].size!, value },
      };
    } else if (field === "efficiencies.0.value") {
      updated[index] = {
        ...updated[index],
        efficiencies: [
          { unit: updated[index].efficiencies?.[0]?.unit || "SEER2", value },
        ],
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setEquipmentItems(updated);
  };

  const buildPackage = (): HVACInstallPackage => {
    return {
      systemDesign: {
        isPreliminary: false,
        systems: [
          {
            systemCategory,
            conditionedArea: parseInt(conditionedArea) || 0,
            ahriNumber: ahriNumber || undefined,
            equipment: {
              items: equipmentItems.map((item) => ({
                ...item,
                serialNumbers: item.serialNumbers?.filter(
                  (sn) => sn.trim() !== "",
                ),
              })),
            },
          },
        ],
      },
      systemInstallDate: installDate ? { epc: installDate } : undefined,
      permitAttestation: permitAttestation
        ? { attestmentText: attestationText || "Permit requirements confirmed" }
        : undefined,
    };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const pkg = buildPackage();
      const res = await fetch(
        `/api/finance/lightreach/install-package/${accountId}?action=save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pkg),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save install package");
      }

      toast.success("Install package saved as draft");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!conditionedArea || parseInt(conditionedArea) <= 0) {
      toast.error("Conditioned area is required");
      return;
    }
    if (!installDate) {
      toast.error("Install date is required");
      return;
    }
    if (!permitAttestation) {
      toast.error("You must attest to permit requirements");
      return;
    }

    // Validate equipment items have serial numbers
    const missingSerials = equipmentItems.some(
      (item) => !item.serialNumbers?.length || !item.serialNumbers[0]?.trim(),
    );
    if (missingSerials) {
      toast.error(
        "All equipment items must have serial numbers for submission",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const pkg = buildPackage();
      const res = await fetch(
        `/api/finance/lightreach/install-package/${accountId}?action=submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pkg),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit install package");
      }

      toast.success("Install package submitted for review");
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="size-5" />
          <CardTitle>Install Package</CardTitle>
        </div>
        <CardDescription>
          Submit installation details for NTP (Notice to Proceed) and funding.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Flags/Warnings */}
        {flagsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading review flags...
          </div>
        ) : flags.length > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="size-4" />
              Review Flags
            </p>
            <ul className="space-y-1">
              {flags.map((flag, i) => (
                <li
                  key={i}
                  className="text-sm text-amber-700 dark:text-amber-300"
                >
                  {flag.message || flag.type || JSON.stringify(flag)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* System Category */}
        <div className="space-y-2">
          <Label>System Category</Label>
          <Select
            value={systemCategory}
            onValueChange={(v) => setSystemCategory(v as HVACSystemCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {systemCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conditioned Area */}
        <div className="space-y-2">
          <Label htmlFor="conditionedArea">
            Conditioned Area (sq ft) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="conditionedArea"
            type="number"
            value={conditionedArea}
            onChange={(e) => setConditionedArea(e.target.value)}
            placeholder="2500"
          />
        </div>

        {/* AHRI Number */}
        <div className="space-y-2">
          <Label htmlFor="ahriNumber">AHRI Number</Label>
          <Input
            id="ahriNumber"
            value={ahriNumber}
            onChange={(e) => setAhriNumber(e.target.value)}
            placeholder="Optional - AHRI certification number"
          />
        </div>

        {/* Install Date */}
        <div className="space-y-2">
          <Label htmlFor="installDate">
            Install Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="installDate"
            type="date"
            value={installDate}
            onChange={(e) => setInstallDate(e.target.value)}
          />
        </div>

        {/* Equipment Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Equipment</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEquipmentItem}
            >
              <Plus className="size-4 mr-1" />
              Add Equipment
            </Button>
          </div>

          {equipmentItems.map((item, index) => (
            <div key={index} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Equipment #{index + 1}</Badge>
                {equipmentItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEquipmentItem(index)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={item.type}
                    onValueChange={(v) => updateEquipmentItem(index, "type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Manufacturer</Label>
                  <Select
                    value={item.manufacturer}
                    onValueChange={(v) =>
                      updateEquipmentItem(index, "manufacturer", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map((mfr) => (
                        <SelectItem key={mfr} value={mfr}>
                          {mfr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Name / Description</Label>
                <Input
                  value={item.name}
                  onChange={(e) =>
                    updateEquipmentItem(index, "name", e.target.value)
                  }
                  placeholder="e.g., Carrier Infinity 18VS Heat Pump"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Model Number</Label>
                  <Input
                    value={item.model}
                    onChange={(e) =>
                      updateEquipmentItem(index, "model", e.target.value)
                    }
                    placeholder="e.g., 25VNA036A003"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Size (tons)</Label>
                  <Input
                    value={item.size?.value || ""}
                    onChange={(e) =>
                      updateEquipmentItem(index, "size.value", e.target.value)
                    }
                    placeholder="e.g., 3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Efficiency (SEER2)</Label>
                  <Input
                    value={item.efficiencies?.[0]?.value || ""}
                    onChange={(e) =>
                      updateEquipmentItem(
                        index,
                        "efficiencies.0.value",
                        e.target.value,
                      )
                    }
                    placeholder="e.g., 18"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">
                    Serial Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={item.serialNumbers?.[0] || ""}
                    onChange={(e) =>
                      updateEquipmentItem(index, "serialNumbers", [
                        e.target.value,
                      ])
                    }
                    placeholder="Required for submission"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Permit Attestation */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="permitAttestation"
              checked={permitAttestation}
              onCheckedChange={(checked) =>
                setPermitAttestation(checked === true)
              }
            />
            <div className="space-y-1">
              <Label
                htmlFor="permitAttestation"
                className="font-medium cursor-pointer"
              >
                Permit Attestation <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                I attest that all required permits have been obtained and the
                installation complies with local building codes.
              </p>
            </div>
          </div>

          {permitAttestation && (
            <div className="space-y-1 ml-7">
              <Label className="text-xs">Additional Notes (optional)</Label>
              <Textarea
                value={attestationText}
                onChange={(e) => setAttestationText(e.target.value)}
                placeholder="Permit number, inspection date, or other notes..."
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || isSubmitting}
          >
            {isSaving ? (
              <Spinner className="mr-2 size-4" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isSubmitting}>
            {isSubmitting ? (
              <Spinner className="mr-2 size-4" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            Submit for Review
          </Button>
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isSaving || isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
