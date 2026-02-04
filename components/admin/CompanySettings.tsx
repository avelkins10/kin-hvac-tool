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
import {
  Building2,
  Save,
  Key,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
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
  const [testingCredentials, setTestingCredentials] = useState(false);
  const [credentialsStatus, setCredentialsStatus] = useState<
    "untested" | "valid" | "invalid"
  >("untested");
  const [formData, setFormData] = useState({
    name: "",
    settings: {} as any,
  });
  const [lightreachEmail, setLightreachEmail] = useState("");
  const [lightreachPassword, setLightreachPassword] = useState("");
  const [lightreachEnvironment, setLightreachEnvironment] = useState("next");

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
        // Load LightReach settings
        if (data.settings?.lightreach) {
          setLightreachEmail(data.settings.lightreach.email || "");
          setLightreachEnvironment(
            data.settings.lightreach.environment || "next",
          );
          // Don't load password - it should be re-entered for security
          if (data.settings.lightreach.configured) {
            setCredentialsStatus("valid");
          }
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

  const testAndSaveCredentials = async () => {
    if (!lightreachEmail || !lightreachPassword) {
      toast.error("Please enter both email and password");
      return;
    }

    setTestingCredentials(true);
    setCredentialsStatus("untested");

    try {
      // Test the credentials by calling the test endpoint
      const response = await fetch("/api/finance/lightreach/test-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: lightreachEmail,
          password: lightreachPassword,
          environment: lightreachEnvironment,
        }),
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        setCredentialsStatus("valid");

        // Save credentials to company settings
        const updatedSettings = {
          ...formData.settings,
          lightreach: {
            email: lightreachEmail,
            environment: lightreachEnvironment,
            configured: true,
            // Password is stored encrypted on the server
          },
        };

        // Save to server (credentials saved separately via secure endpoint)
        await fetch("/api/company/lightreach-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: lightreachEmail,
            password: lightreachPassword,
            environment: lightreachEnvironment,
          }),
        });

        setFormData({ ...formData, settings: updatedSettings });
        toast.success("LightReach credentials verified and saved!");
      } else {
        setCredentialsStatus("invalid");
        toast.error(
          result.error ||
            "Invalid credentials. Please check your email and password.",
        );
      }
    } catch (error) {
      console.error("Error testing credentials:", error);
      setCredentialsStatus("invalid");
      toast.error("Failed to test credentials. Please try again.");
    } finally {
      setTestingCredentials(false);
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
            {credentialsStatus === "valid" && (
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-700 border-green-200"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
            {credentialsStatus === "invalid" && (
              <Badge
                variant="outline"
                className="ml-2 bg-red-50 text-red-700 border-red-200"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Invalid
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Configure your LightReach (Palmetto Finance) credentials for Comfort
            Plan financing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lightreachEmail">Account Email</Label>
              <Input
                id="lightreachEmail"
                type="email"
                value={lightreachEmail}
                onChange={(e) => {
                  setLightreachEmail(e.target.value);
                  setCredentialsStatus("untested");
                }}
                placeholder="your-account@company.com"
              />
            </div>
            <div>
              <Label htmlFor="lightreachPassword">Password</Label>
              <Input
                id="lightreachPassword"
                type="password"
                value={lightreachPassword}
                onChange={(e) => {
                  setLightreachPassword(e.target.value);
                  setCredentialsStatus("untested");
                }}
                placeholder={
                  credentialsStatus === "valid" ? "••••••••" : "Enter password"
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lightreachEnv">Environment</Label>
            <select
              id="lightreachEnv"
              value={lightreachEnvironment}
              onChange={(e) => {
                setLightreachEnvironment(e.target.value);
                setCredentialsStatus("untested");
              }}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="next">Staging (next.palmetto.finance)</option>
              <option value="prod">Production (palmetto.finance)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Use Staging for testing, Production for live applications
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={testAndSaveCredentials}
              disabled={testingCredentials || !lightreachEmail}
              variant={credentialsStatus === "valid" ? "outline" : "default"}
            >
              {testingCredentials ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : credentialsStatus === "valid" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Re-test Credentials
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Test & Save Credentials
                </>
              )}
            </Button>
          </div>

          {credentialsStatus === "invalid" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <p className="font-medium">Unable to verify credentials</p>
              <p className="mt-1">
                Please check your email and password. Make sure you&apos;re
                using the correct environment (Staging vs Production).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
