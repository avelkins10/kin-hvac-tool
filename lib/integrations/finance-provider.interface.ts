// Generic finance provider interface for multiple lenders

export interface FinanceApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  systemPrice: number;
  // Palmetto Finance specific fields
  salesRepName?: string;
  salesRepEmail?: string;
  salesRepPhoneNumber?: string;
  externalReference?: string; // Link to proposal ID
  externalReferenceIds?: Array<{ type: string; id: string }>;
  friendlyName?: string; // Human-readable name for Palmetto dashboard (e.g. customer name)
  systemDesign?: Record<string, unknown>; // HVAC system design for LightReach portal (home size, equipment, etc.)
  // Organization impersonation - routes account to correct dealer in LightReach
  orgAlias?: string;
  [key: string]: any; // Allow additional lender-specific fields
}

export interface FinanceApplicationResponse {
  applicationId: string;
  status:
    | "pending"
    | "submitted"
    | "approved"
    | "denied"
    | "conditional"
    | "cancelled";
  monthlyPayment?: number;
  totalCost?: number;
  apr?: number;
  term?: number;
  message?: string;
  [key: string]: any; // Allow additional lender-specific fields
}

export interface GetPaymentScheduleOptions {
  systemDesign?: Record<string, unknown>;
}

export interface IFinanceProvider {
  createApplication(
    data: FinanceApplicationData,
  ): Promise<FinanceApplicationResponse>;
  getApplicationStatus(
    applicationId: string,
  ): Promise<FinanceApplicationResponse>;
  getPaymentSchedule(
    applicationId: string,
    options?: GetPaymentScheduleOptions,
  ): Promise<any>;
}
