"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Save, Key, CheckCircle, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

interface CompanyData {
  id: string;
  name: string;
  settings: any;
}

export function CompanySettings() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLightreach, setSavingLightreach] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    settings: {} as any,
  });
  // LightReach org alias for impersonation (NOT credentials - those are platform-level)
  const [lightreachOrgAlias, setLightreachOrgAlias] = useState("");

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/company/settings");
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
        setFormData({
          name: data.name || "",
          settings: data.settings || {},
        });
        // Load LightReach org alias
        if (data.settings?.lightreach?.orgAlias) {
          setLightreachOrgAlias(data.settings.lightreach.orgAlias);
        }
      } else {
        toast.error("Failed to load company settings");
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      toast.error("Failed to load company settings");
    } finally {
      setLoading(false);
    }
  };

  const saveLightreachSettings = async () => {
    if (!lightreachOrgAlias.trim()) {
      toast.error("Please enter an organization alias");
      return;
    }

    setSavingLightreach(true);

    try {
      const response = await fetch("/api/company/lightreach-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgAlias: lightreachOrgAlias.trim(),
        }),
      });

      if (response.ok) {
        // Update local state
        const updatedSettings = {
          ...formData.settings,
          lightreach: {
            ...formData.settings?.lightreach,
            orgAlias: lightreachOrgAlias.trim(),
            configured: true,
          },
        };
        setFormData({ ...formData, settings: updatedSettings });
        toast.success("LightReach organization settings saved!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving LightReach settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSavingLightreach(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/company/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setCompany(updated);
        toast.success("Company settings updated successfully");
      } else {
        toast.error("Failed to update company settings");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Loading company settings...
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOrgConfigured = !!formData.settings?.lightreach?.configured;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Manage your company name and general settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Your Company Name"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LightReach/Palmetto Finance Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            LightReach Finance Integration
            {isOrgConfigured && (
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-700 border-green-200"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Configured
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Configure your LightReach organization for Comfort Plan financing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info box explaining the architecture */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">How LightReach Integration Works</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Platform credentials</strong> are configured by the
                    system administrator (environment variables)
                  </li>
                  <li>
                    <strong>Organization alias</strong> identifies your company
                    in LightReach&apos;s system
                  </li>
                  <li>
                    <strong>Sales rep info</strong> is configured per-user in
                    their profile settings
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="lightreachOrgAlias">Organization Alias</Label>
            <Input
              id="lightreachOrgAlias"
              value={lightreachOrgAlias}
              onChange={(e) => setLightreachOrgAlias(e.target.value)}
              placeholder="e.g., kin-hvac or your-company-name"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is your company&apos;s identifier in LightReach. Contact
              LightReach support if you don&apos;t know your org alias.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={saveLightreachSettings}
              disabled={savingLightreach || !lightreachOrgAlias.trim()}
            >
              {savingLightreach ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Organization Settings
                </>
              )}
            </Button>
          </div>

          {!isOrgConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <p className="font-medium">Organization not configured</p>
              <p className="mt-1">
                Enter your LightReach organization alias to enable Comfort Plan
                financing for your company.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
