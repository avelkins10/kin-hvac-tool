export interface ApplicationData {
  id: string;
  status: string;
  lenderId: string;
  proposalId?: string;
  externalApplicationId?: string;
  applicationData?: any;
  responseData?: ResponseData;
  createdAt: string;
  updatedAt: string;
  cached?: boolean;
  cacheAge?: number;
  lastUpdated?: string;
}

export interface ResponseData {
  status?: string;
  monthlyPayment?: number;
  totalCost?: number;
  apr?: number;
  term?: number;
  termYears?: number;
  escalatorRate?: number;
  leaseType?: string;
  message?: string;
  paymentSchedule?: any;
  lastFetched?: string;
  contractStatus?: ContractStatus;
  installPackage?: {
    submittedAt?: string;
    savedAt?: string;
  };
  milestones?: any[];
  milestonePackages?: any[];
  quoteExceedsPaymentCap?: boolean;
}

export interface ContractStatus {
  sent?: boolean;
  sentAt?: string;
  signed?: boolean;
  signedAt?: string;
  approved?: boolean;
  approvedAt?: string;
  voided?: boolean;
  voidedAt?: string;
  reinstated?: boolean;
  reinstatedAt?: string;
}

export interface StatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
}
