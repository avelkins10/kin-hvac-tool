"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Wind, Camera, Loader2, Sparkles, AlertCircle } from "lucide-react";
import Image from "next/image";
import { SectionHeader } from "../shared/SectionHeader";
import { FormField } from "../shared/FormField";
import { useProposalState, useCurrentSystem } from "../hooks/useProposalState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Resize image helper (from original component)
async function resizeImageToJpeg(file: File, maxDim = 1600): Promise<File> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));

  const canvas = document.createElement("canvas");
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get canvas context");

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image compression failed"))),
      "image/jpeg",
      0.8,
    );
  });

  return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
    type: "image/jpeg",
  });
}

const SYSTEM_AGE_OPTIONS = [
  { value: "0-5", label: "0-5 years" },
  { value: "6-10", label: "6-10 years" },
  { value: "11-15", label: "11-15 years" },
  { value: "16-20", label: "16-20 years" },
  { value: "20+", label: "Over 20 years" },
  { value: "unknown", label: "Unknown" },
];

const EQUIPMENT_TYPES = [
  { value: "central", label: "Central Air (Split System)" },
  { value: "mini-split", label: "Mini-Split / Ductless" },
  { value: "package", label: "Package Unit (Ground)" },
  { value: "package-rooftop", label: "Package Unit (Rooftop)" },
  { value: "auto", label: "Not Sure / Auto-detect" },
];

const COMMON_ISSUES = [
  "Not cooling effectively",
  "Not heating effectively",
  "Unusual noises",
  "High energy bills",
  "Inconsistent temperatures",
  "Poor air quality",
  "Frequent repairs needed",
  "Short cycling",
  "Refrigerant leaks",
  "Thermostat issues",
];

export function CurrentSystemSection() {
  const currentSystem = useCurrentSystem();
  const { setCurrentSystem, markSectionComplete } = useProposalState();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectChange = useCallback(
    (field: keyof typeof currentSystem) => (value: string) => {
      setCurrentSystem({ [field]: value });
    },
    [setCurrentSystem],
  );

  const handleIssueToggle = useCallback(
    (issue: string) => {
      const newIssues = currentSystem.issues.includes(issue)
        ? currentSystem.issues.filter((i) => i !== issue)
        : [...currentSystem.issues, issue];
      setCurrentSystem({ issues: newIssues });
    },
    [currentSystem.issues, setCurrentSystem],
  );

  const handleCheckboxChange = useCallback(
    (field: keyof typeof currentSystem) => (checked: boolean) => {
      setCurrentSystem({ [field]: checked });
    },
    [setCurrentSystem],
  );

  // Handle photo upload and AI analysis
  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        // Resize and convert to JPEG
        const resizedFile = await resizeImageToJpeg(file);

        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Remove data URL prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(resizedFile);
        });

        // Store the photo
        setCurrentSystem({
          nameplatePhoto: `data:image/jpeg;base64,${base64}`,
        });

        // Call AI analysis API
        const response = await fetch("/api/ai/analyze-nameplate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze image");
        }

        const analysis = await response.json();

        // Update system data with AI results
        setCurrentSystem({
          brand: analysis.brand || "",
          modelNumber: analysis.modelNumber || "",
          tonnage: analysis.tonnage || "",
          seerRating: analysis.seerRating || "",
          refrigerantType: analysis.refrigerantType || "",
          coolingType: analysis.coolingType || "",
          aiAnalysisComplete: true,
        });

        toast.success("System analyzed successfully!");
      } catch (error) {
        console.error("Error analyzing nameplate:", error);
        setAnalysisError(
          "Failed to analyze the image. Please try again or enter details manually.",
        );
        toast.error("Failed to analyze image");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [setCurrentSystem],
  );

  // Check if section is complete
  const isComplete =
    currentSystem.systemAge !== "" && currentSystem.equipmentType !== "auto";

  // Mark section complete (in useEffect to avoid render loop)
  useEffect(() => {
    if (isComplete) {
      markSectionComplete("current-system");
    }
  }, [isComplete, markSectionComplete]);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Current HVAC System"
        description="Document the existing system for accurate recommendations"
        icon={<Wind className="w-6 h-6" />}
      />

      <div className="space-y-6">
        {/* AI Photo Analysis */}
        <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg">
                AI System Analysis
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Take a photo of the equipment nameplate for instant analysis
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className={cn(
                  "mt-4 flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 active:scale-[0.98] transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>
                      {currentSystem.nameplatePhoto
                        ? "Retake Photo"
                        : "Take Photo"}
                    </span>
                  </>
                )}
              </button>

              {/* Analysis error */}
              {analysisError && (
                <div className="mt-3 flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Uploaded photo preview */}
              {currentSystem.nameplatePhoto && (
                <div className="mt-4">
                  <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-border">
                    <Image
                      src={currentSystem.nameplatePhoto}
                      alt="Nameplate photo"
                      width={400}
                      height={300}
                      className="object-cover"
                    />
                    {currentSystem.aiAnalysisComplete && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-success text-white text-xs font-semibold rounded-full flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Analyzed
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI-detected values */}
              {currentSystem.aiAnalysisComplete && (
                <div className="mt-4 grid grid-cols-2 gap-3 animate-bounce-in">
                  {currentSystem.brand && (
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-muted-foreground">Brand</p>
                      <p className="font-medium">{currentSystem.brand}</p>
                    </div>
                  )}
                  {currentSystem.modelNumber && (
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-muted-foreground">Model</p>
                      <p className="font-medium font-mono text-sm">
                        {currentSystem.modelNumber}
                      </p>
                    </div>
                  )}
                  {currentSystem.tonnage && (
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-muted-foreground">Tonnage</p>
                      <p className="font-medium">
                        {currentSystem.tonnage} tons
                      </p>
                    </div>
                  )}
                  {currentSystem.seerRating && (
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-muted-foreground">SEER</p>
                      <p className="font-medium">{currentSystem.seerRating}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Age */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            System Age <span className="text-destructive">*</span>
          </Label>
          <Select
            value={currentSystem.systemAge}
            onValueChange={handleSelectChange("systemAge")}
          >
            <SelectTrigger className="rounded-xl h-auto py-3">
              <SelectValue placeholder="Select age range" />
            </SelectTrigger>
            <SelectContent>
              {SYSTEM_AGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Equipment Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Equipment Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={currentSystem.equipmentType}
            onValueChange={handleSelectChange("equipmentType")}
          >
            <SelectTrigger className="rounded-xl h-auto py-3">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ductwork */}
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
          <Checkbox
            id="hasDuctwork"
            checked={currentSystem.hasDuctwork}
            onCheckedChange={handleCheckboxChange("hasDuctwork")}
            className="mt-1"
          />
          <div>
            <Label
              htmlFor="hasDuctwork"
              className="text-sm font-medium cursor-pointer"
            >
              Home has existing ductwork
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Ductwork is required for central air systems
            </p>
          </div>
        </div>

        {/* Current Issues */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Current Issues</Label>
          <div className="grid grid-cols-2 gap-2">
            {COMMON_ISSUES.map((issue) => (
              <button
                key={issue}
                type="button"
                onClick={() => handleIssueToggle(issue)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm text-left transition-all",
                  "border hover:border-primary/50",
                  currentSystem.issues.includes(issue)
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card text-foreground",
                )}
              >
                {issue}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Completion indicator */}
      {isComplete && (
        <div className="flex items-center gap-2 p-4 bg-success-light rounded-xl text-success animate-bounce-in">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">Current system documented</span>
        </div>
      )}
    </div>
  );
}

export default CurrentSystemSection;
