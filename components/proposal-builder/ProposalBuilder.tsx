"use client";

import { useCallback, useEffect, useRef } from "react";
import { BuilderLayout } from "./BuilderLayout";
import { SectionNav } from "./SectionNav";
import { PricingSummary } from "./PricingSummary";
import { CustomerSection } from "./sections/CustomerSection";
import { PropertySection } from "./sections/PropertySection";
import { CurrentSystemSection } from "./sections/CurrentSystemSection";
import { NeedsSection } from "./sections/NeedsSection";
import { EquipmentSection } from "./sections/EquipmentSection";
import { AddOnsSection } from "./sections/AddOnsSection";
import { MaintenanceSection } from "./sections/MaintenanceSection";
import { IncentivesSection } from "./sections/IncentivesSection";
import { FinancingSection } from "./sections/FinancingSection";
import { ReviewSection } from "./sections/ReviewSection";
import { PresentationMode } from "../proposal-presentation/PresentationMode";
import {
  useProposalState,
  useActiveSection,
  useMode,
  type BuilderSection,
} from "./hooks/useProposalState";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";
import { toast } from "sonner";

interface ProposalBuilderProps {
  onAdminAccess?: () => void;
  onSaveRef?: (saveFn: () => Promise<void>) => void;
  onProposalIdChange?: (id: string | null) => void;
  initialProposalId?: string;
}

export function ProposalBuilder({
  onAdminAccess,
  onSaveRef,
  onProposalIdChange,
  initialProposalId,
}: ProposalBuilderProps) {
  const mode = useMode();
  const activeSection = useActiveSection();
  const {
    setProposalId,
    proposalId,
    isDirty,
    markSaved,
    setLoading,
    loadProposal,
    customer,
    property,
    currentSystem,
    needs,
    selectedEquipment,
    addOns,
    maintenancePlan,
    maintenanceYears,
    incentives,
    paymentMethod,
    financingOption,
    status,
  } = useProposalState();

  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<Date | null>(null);

  // Save proposal to API
  const saveProposal = useCallback(async () => {
    try {
      const proposalData = {
        customer,
        property,
        currentSystem,
        needs,
        selectedEquipment,
        addOns,
        maintenancePlan,
        maintenanceYears,
        incentives,
        paymentMethod,
        financingOption,
        status,
      };

      const endpoint = proposalId
        ? `/api/proposals/${proposalId}`
        : "/api/proposals";
      const method = proposalId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposalData),
      });

      if (response.ok) {
        const result = await response.json();
        if (!proposalId && result.id) {
          setProposalId(result.id);
          onProposalIdChange?.(result.id);
        }
        markSaved();
        lastSaveRef.current = new Date();
      } else {
        throw new Error("Failed to save proposal");
      }
    } catch (error) {
      console.error("Error saving proposal:", error);
      toast.error("Failed to save proposal");
    }
  }, [
    proposalId,
    customer,
    property,
    currentSystem,
    needs,
    selectedEquipment,
    addOns,
    maintenancePlan,
    maintenanceYears,
    incentives,
    paymentMethod,
    financingOption,
    status,
    setProposalId,
    onProposalIdChange,
    markSaved,
  ]);

  // Expose save function to parent
  useEffect(() => {
    onSaveRef?.(saveProposal);
  }, [onSaveRef, saveProposal]);

  // Auto-save every 10 seconds if dirty
  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(() => {
      if (isDirty) {
        saveProposal();
      }
    }, 10000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [isDirty, saveProposal]);

  // Load existing proposal
  useEffect(() => {
    if (initialProposalId && initialProposalId !== proposalId) {
      setLoading(true);
      fetch(`/api/proposals/${initialProposalId}`)
        .then((res) => res.json())
        .then((data) => {
          loadProposal({
            ...data,
            proposalId: initialProposalId,
          });
          setProposalId(initialProposalId);
        })
        .catch((err) => {
          console.error("Failed to load proposal:", err);
          toast.error("Failed to load proposal");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [initialProposalId, proposalId, loadProposal, setProposalId, setLoading]);

  // Render the active section content
  const renderSection = useCallback((section: BuilderSection) => {
    switch (section) {
      case "customer":
        return <CustomerSection />;
      case "property":
        return <PropertySection />;
      case "current-system":
        return <CurrentSystemSection />;
      case "needs":
        return <NeedsSection />;
      case "equipment":
        return <EquipmentSection />;
      case "add-ons":
        return <AddOnsSection />;
      case "maintenance":
        return <MaintenanceSection />;
      case "incentives":
        return <IncentivesSection />;
      case "financing":
        return <FinancingSection />;
      case "review":
        return <ReviewSection />;
      default:
        return <CustomerSection />;
    }
  }, []);

  // If in presentation mode, render the full-screen presentation
  if (mode === "presentation") {
    return <PresentationMode />;
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Auto-save indicator */}
      <div className="fixed top-4 right-4 z-50">
        <AutoSaveIndicator
          isSaving={false}
          lastSaved={lastSaveRef.current}
          hasUnsavedChanges={isDirty}
        />
      </div>

      <BuilderLayout
        leftSidebar={<SectionNav onAdminAccess={onAdminAccess} />}
        rightSidebar={<PricingSummary />}
      >
        <div className="animate-bounce-in">{renderSection(activeSection)}</div>
      </BuilderLayout>
    </div>
  );
}

export default ProposalBuilder;
