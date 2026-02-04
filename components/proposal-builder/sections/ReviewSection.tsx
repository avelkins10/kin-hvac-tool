"use client";

import { useCallback, useMemo } from "react";
import {
  ClipboardCheck,
  Check,
  User,
  Home,
  Wind,
  Package,
  Sparkles,
  Shield,
  Gift,
  CreditCard,
  Edit2,
  Presentation,
  Send,
} from "lucide-react";
import { SectionHeader } from "../shared/SectionHeader";
import { AnimatedPrice } from "../shared/AnimatedPrice";
import {
  useProposalState,
  useCustomer,
  useProperty,
  useCurrentSystem,
  useSelectedEquipment,
  useAddOns,
  useMaintenancePlan,
  useIncentives,
  usePaymentMethod,
  useFinancingOption,
} from "../hooks/useProposalState";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewItemProps {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
  section: string;
  onEdit: () => void;
}

function ReviewItem({ icon, title, content, onEdit }: ReviewItemProps) {
  return (
    <div className="p-4 bg-card rounded-xl border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <div className="text-sm text-muted-foreground mt-1">{content}</div>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function ReviewSection() {
  const customer = useCustomer();
  const property = useProperty();
  const currentSystem = useCurrentSystem();
  const selectedEquipment = useSelectedEquipment();
  const addOns = useAddOns();
  const maintenancePlan = useMaintenancePlan();
  const incentives = useIncentives();
  const paymentMethod = usePaymentMethod();
  const financingOption = useFinancingOption();
  const {
    setActiveSection,
    calculatePricing,
    toggleMode,
    maintenanceYears,
    markSectionComplete,
  } = useProposalState();

  const pricing = useMemo(() => calculatePricing(), [calculatePricing]);
  const selectedAddOns = addOns.filter((a) => a.selected);
  const selectedIncentives = incentives.filter((i) => i.selected);

  const handleEdit = useCallback(
    (section: string) => {
      setActiveSection(section as any);
    },
    [setActiveSection]
  );

  const handleSendProposal = useCallback(async () => {
    try {
      // In a real implementation, this would send the proposal to the customer
      toast.success("Proposal sent to customer!");
      markSectionComplete("review");
    } catch (error) {
      toast.error("Failed to send proposal");
    }
  }, [markSectionComplete]);

  const canPresent = selectedEquipment !== null;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Review & Submit"
        description="Review your proposal before presenting to the customer"
        icon={<ClipboardCheck className="w-6 h-6" />}
      />

      <div className="space-y-4">
        {/* Customer */}
        <ReviewItem
          icon={<User className="w-5 h-5" />}
          title="Customer"
          section="customer"
          onEdit={() => handleEdit("customer")}
          content={
            customer.name ? (
              <div>
                <p className="font-medium text-foreground">{customer.name}</p>
                <p>{customer.email}</p>
                <p>{customer.phone}</p>
                <p>
                  {customer.address}, {customer.city}, {customer.state}{" "}
                  {customer.zip}
                </p>
              </div>
            ) : (
              <p className="text-warning">Customer info not complete</p>
            )
          }
        />

        {/* Property */}
        <ReviewItem
          icon={<Home className="w-5 h-5" />}
          title="Property"
          section="property"
          onEdit={() => handleEdit("property")}
          content={
            property.squareFootage ? (
              <p>
                {property.squareFootage.toLocaleString()} sq ft • {property.stories} story •{" "}
                {property.bedrooms} bed • {property.bathrooms} bath • Built{" "}
                {property.yearBuilt}
              </p>
            ) : (
              <p className="text-warning">Property details not complete</p>
            )
          }
        />

        {/* Current System */}
        <ReviewItem
          icon={<Wind className="w-5 h-5" />}
          title="Current System"
          section="current-system"
          onEdit={() => handleEdit("current-system")}
          content={
            currentSystem.systemAge ? (
              <p>
                {currentSystem.equipmentType} system • {currentSystem.systemAge} old
                {currentSystem.issues.length > 0 &&
                  ` • ${currentSystem.issues.length} issue(s) reported`}
              </p>
            ) : (
              <p className="text-muted-foreground">No current system info</p>
            )
          }
        />

        {/* Equipment */}
        <ReviewItem
          icon={<Package className="w-5 h-5" />}
          title="Selected Equipment"
          section="equipment"
          onEdit={() => handleEdit("equipment")}
          content={
            selectedEquipment ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {selectedEquipment.name}
                  </p>
                  <p className="capitalize">{selectedEquipment.tier} tier</p>
                </div>
                <AnimatedPrice
                  value={selectedEquipment.customerPrice}
                  className="font-bold text-foreground"
                />
              </div>
            ) : (
              <p className="text-warning">No equipment selected</p>
            )
          }
        />

        {/* Add-ons */}
        {selectedAddOns.length > 0 && (
          <ReviewItem
            icon={<Sparkles className="w-5 h-5" />}
            title="Add-Ons"
            section="add-ons"
            onEdit={() => handleEdit("add-ons")}
            content={
              <div className="space-y-1">
                {selectedAddOns.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between"
                  >
                    <span>{addon.name}</span>
                    <span className="font-medium">
                      ${addon.customerPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            }
          />
        )}

        {/* Maintenance */}
        {maintenancePlan && (
          <ReviewItem
            icon={<Shield className="w-5 h-5" />}
            title="Maintenance Plan"
            section="maintenance"
            onEdit={() => handleEdit("maintenance")}
            content={
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {maintenancePlan.name}
                  </p>
                  <p>{maintenanceYears} year(s)</p>
                </div>
                <AnimatedPrice
                  value={maintenancePlan.price * maintenanceYears}
                  className="font-bold text-foreground"
                />
              </div>
            }
          />
        )}

        {/* Incentives */}
        {selectedIncentives.length > 0 && (
          <ReviewItem
            icon={<Gift className="w-5 h-5" />}
            title="Incentives"
            section="incentives"
            onEdit={() => handleEdit("incentives")}
            content={
              <div className="space-y-1">
                {selectedIncentives.map((incentive) => (
                  <div
                    key={incentive.id}
                    className="flex items-center justify-between"
                  >
                    <span>{incentive.name}</span>
                    <span className="font-medium text-success">
                      -${incentive.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            }
          />
        )}

        {/* Payment */}
        <ReviewItem
          icon={<CreditCard className="w-5 h-5" />}
          title="Payment Method"
          section="financing"
          onEdit={() => handleEdit("financing")}
          content={
            <p className="capitalize">
              {paymentMethod === "cash"
                ? "Pay in Full"
                : paymentMethod === "leasing"
                ? `Comfort Plan${financingOption ? ` - ${financingOption.name}` : ""}`
                : `Financing${financingOption ? ` - ${financingOption.name}` : ""}`}
            </p>
          }
        />
      </div>

      {/* Pricing Summary */}
      <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
        <h3 className="font-heading font-bold text-lg mb-4">
          Investment Summary
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Equipment</span>
            <span className="font-medium">
              ${pricing.equipmentPrice.toLocaleString()}
            </span>
          </div>
          {pricing.addOnsTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Add-ons</span>
              <span className="font-medium">
                ${pricing.addOnsTotal.toLocaleString()}
              </span>
            </div>
          )}
          {pricing.maintenanceTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maintenance</span>
              <span className="font-medium">
                ${pricing.maintenanceTotal.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              ${pricing.subtotal.toLocaleString()}
            </span>
          </div>
          {pricing.incentivesTotal > 0 && (
            <div className="flex justify-between text-success">
              <span>Incentives</span>
              <span className="font-medium">
                -${pricing.incentivesTotal.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mt-4 pt-4 border-t border-primary/20">
          <div>
            <p className="text-sm text-muted-foreground">Total Investment</p>
          </div>
          <div className="text-right">
            <AnimatedPrice
              value={pricing.grandTotal}
              className="text-4xl font-heading font-bold text-foreground"
            />
            {pricing.monthlyPayment && (
              <p className="text-sm text-muted-foreground">
                or{" "}
                <span className="font-semibold text-primary">
                  ${Math.round(pricing.monthlyPayment).toLocaleString()}/mo
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={toggleMode}
          disabled={!canPresent}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all",
            canPresent
              ? "bg-gradient-accent text-white hover:opacity-90 active:scale-[0.99] gradient-shimmer"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Presentation className="w-5 h-5" />
          Present to Customer
        </button>

        <button
          onClick={handleSendProposal}
          disabled={!canPresent}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold border-2 transition-all",
            canPresent
              ? "border-primary text-primary hover:bg-primary/5 active:scale-[0.99]"
              : "border-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5" />
          Send Proposal
        </button>
      </div>

      {!canPresent && (
        <p className="text-center text-sm text-muted-foreground">
          Please select equipment to enable presentation and send options.
        </p>
      )}
    </div>
  );
}

export default ReviewSection;
