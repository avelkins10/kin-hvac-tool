import { FinanceApplicationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// Webhook event types from LightReach/Palmetto
export type LightReachEventType =
  | "account.status_changed"
  | "account.created"
  | "contract.sent"
  | "contract.signed"
  | "contract.approved"
  | "contract.rejected"
  | "stipulation.created"
  | "stipulation.completed"
  | "stipulation.expired"
  | "funding.approved"
  | "funding.completed";

// Webhook payload structure
export interface LightReachWebhookPayload {
  eventId: string;
  eventType: LightReachEventType;
  timestamp: string;
  data: {
    accountId?: string;
    applicationId?: string;
    status?: string;
    previousStatus?: string;
    contractId?: string;
    stipulationId?: string;
    stipulationType?: string;
    fundingAmount?: number;
    [key: string]: unknown;
  };
}

// Status mapping from LightReach to our internal status
const STATUS_MAP: Record<string, FinanceApplicationStatus> = {
  pending: "PENDING",
  submitted: "SUBMITTED",
  approved: "APPROVED",
  conditional: "CONDITIONAL",
  denied: "DENIED",
  cancelled: "CANCELLED",
  // Additional LightReach statuses
  credit_approved: "APPROVED",
  credit_denied: "DENIED",
  contract_pending: "CONDITIONAL",
  funded: "APPROVED",
};

// Milestone types
export type MilestoneType =
  | "application_submitted"
  | "credit_approved"
  | "credit_denied"
  | "contract_sent"
  | "contract_signed"
  | "contract_approved"
  | "stipulation_pending"
  | "stipulation_completed"
  | "funding_approved"
  | "funded";

/**
 * Process a webhook event from LightReach
 */
export async function processWebhookEvent(
  payload: LightReachWebhookPayload,
): Promise<{ success: boolean; message: string }> {
  const { eventId, eventType, data } = payload;

  console.log("[LightReach Webhook] Processing event:", {
    eventId,
    eventType,
    accountId: data.accountId,
    timestamp: new Date().toISOString(),
  });

  try {
    // Handle different event types
    switch (eventType) {
      case "account.status_changed":
        return await handleAccountStatusChanged(data);

      case "account.created":
        return await handleAccountCreated(data);

      case "contract.sent":
        return await handleContractSent(data);

      case "contract.signed":
        return await handleContractSigned(data);

      case "contract.approved":
        return await handleContractApproved(data);

      case "contract.rejected":
        return await handleContractRejected(data);

      case "stipulation.created":
        return await handleStipulationCreated(data);

      case "stipulation.completed":
        return await handleStipulationCompleted(data);

      case "funding.approved":
      case "funding.completed":
        return await handleFundingEvent(eventType, data);

      default:
        console.log("[LightReach Webhook] Unknown event type:", eventType);
        return { success: true, message: `Unknown event type: ${eventType}` };
    }
  } catch (error) {
    console.error("[LightReach Webhook] Error processing event:", error);
    throw error;
  }
}

/**
 * Handle account status change
 */
async function handleAccountStatusChanged(
  data: LightReachWebhookPayload["data"],
): Promise<{ success: boolean; message: string }> {
  const { accountId, status, previousStatus } = data;

  if (!accountId || !status) {
    return { success: false, message: "Missing accountId or status" };
  }

  // Find the finance application by external ID
  const application = await prisma.financeApplication.findFirst({
    where: { externalApplicationId: accountId },
  });

  if (!application) {
    console.log("[LightReach Webhook] Application not found:", accountId);
    return {
      success: true,
      message: "Application not found (may not be ours)",
    };
  }

  // Map status
  const internalStatus = STATUS_MAP[status.toLowerCase()] || application.status;

  // Update application status
  await prisma.financeApplication.update({
    where: { id: application.id },
    data: {
      status: internalStatus,
      responseData: {
        ...((application.responseData as object) || {}),
        lastWebhookStatus: status,
        previousStatus,
        statusUpdatedAt: new Date().toISOString(),
      },
    },
  });

  // Create milestone if status indicates progress
  if (
    status.toLowerCase() === "approved" ||
    status.toLowerCase() === "credit_approved"
  ) {
    await createMilestone(application.id, "credit_approved");
  }

  console.log("[LightReach Webhook] Updated application status:", {
    applicationId: application.id,
    oldStatus: previousStatus,
    newStatus: internalStatus,
  });

  return { success: true, message: `Status updated to ${internalStatus}` };
}

/**
 * Handle new account creation
 */
async function handleAccountCreated(
  data: LightReachWebhookPayload["data"],
): Promise<{ success: boolean; message: string }> {
  const { accountId } = data;

  if (!accountId) {
    return { success: false, message: "Missing accountId" };
  }

  // Find application and create milestone
  const application = await prisma.financeApplication.findFirst({
    where: { externalApplicationId: accountId },
  });

  if (application) {
    await createMilestone(application.id, "application_submitted");
  }

  return { success: true, message: "Account creation acknowledged" };
}

/**
 * Handle contract sent
 */
async function handleContractSent(
  data: LightReachWebhookPayload["data"],
): Promise<{ success: boolean; message: string }> {
  const { accountId, contractId } = data;

  if (!accountId) {
    return { success: false, message: "Missing accountId" };
  }

  const application = await prisma.financeApplication.findFirst({
    where: { externalApplicationId: accountId },
  });

  if (application) {
    await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        responseData: {
          ...((application.responseData as object) || {}),
          contractId,
          contractSentAt: new Date().toISOString(),
        },
      },
    });
    await createMilestone(application.id, "contract_sent");
  }

  return { success: true, message: "Contract sent milestone recorded" };
}

/**
 * Handle contract signed
 */
async function handleContractSigned(
  data: LightReachWebhookPayload["data"],
): Promise<{ success: boolean; message: string }> {
  const { accountId, contractId } = data;

  if (!accountId) {
    return { success: false, message: "Missing accountId" };
  }

  const application = await prisma.financeApplication.findFirst({
    where: { externalApplicationId: accountId },
  });

  if (application) {
    await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        status: "CONDITIONAL", // Pending final approval
        responseData: {
          ...((application.responseData as object) || {}),
          contractId,
          contractSignedAt: new Date().toISOString(),
        },
      },
    });
    await createMilestone(application.id, "contract_signed");
  }

  return { success: true, message: "Contract signed milestone recorded" };
}

/**
 * Handle contract approved
 */
async function handleContractApproved(
  data: LightReachWebhookPayload["data"],
): Promise<{ success: boolean; message: string }> {
  const { accountId, contractId } = data;

  if (!accountId) {
    return { success: false, message: "Missing accountId" };
  }

  const application = await prisma.financeApplication.findFirst({
    where: { externalApplicationId: accountId },
  });

  if (application) {
    await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        responseData: {
          ...((application.responseData as object) || {}),
          contractId,
          contractApprovedAt: new Date().toISOString(),
        },
      },
    });
    await createMilestone(application.id, "contract_approved");
  }

  return { success: true, message: "Contract approved milestone recorded" };
}

/**
 * Handle contract rejected
 */
async function handleContractRejected(
  data: LightReachWebhookPayload["data"],
): Promise<{ success: boolean; message: string }> {
  const { accountId } = data;

  if (!accountId) {
    return { success: false, message: "Missing accountId" };
  }

  const application = await prisma.financeApplication.findFirst({
    where: { externalApplicationId: accountId },
  });

  if (application) {
    await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        status: "DENIED",
        responseData: {
          ...((application.responseData as object) || {}),
          contractRejectedAt: new Date().toISOString(),
        },
      },
    });
  }

  return { success: true, message: "Contract rejection recorded" };
}

/**
 * Handle stipulation created
 */
async function handleStipulationCreated(
  data: LightReachWebhookPayload["data"],
): Promise<{ success: boolean; message: string }> {
  const { accountId, stipulationId, stipulationType } = data;

  if (!accountId) {
    return { success: false, message: "Missing accountId" };
  }

  const application = await prisma.financeApplication.findFirst({
    where: { externalApplicationId: accountId },
  });

  if (application) {
    const currentData =
      (application.responseData as Record<string, unknown>) || {};
    const stipulations = (currentData.stipulations as Array<unknown>) || [];

    const newStipulations = [
      ...stipulations,
      {
        id: stipulationId,
        type: stipulationType,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ];

    await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        status: "CONDITIONAL",
        responseData: {
          ...currentData,
          stipulations: newStipulations,
        } as Prisma.InputJsonObject,
      },
    });
    await createMilestone(application.id, "stipulation_pending", {
      stipulationId,
      stipulationType,
    });
  }

  return { success: true, message: "Stipulation created milestone recorded" };
}

/**
 * Handle stipulation completed
 */
async function handleStipulationCompleted(
  data: LightReachWebhookPayload["data"],
): Promise<{ success: boolean; message: string }> {
  const { accountId, stipulationId } = data;

  if (!accountId) {
    return { success: false, message: "Missing accountId" };
  }

  const application = await prisma.financeApplication.findFirst({
    where: { externalApplicationId: accountId },
  });

  if (application) {
    const currentData =
      (application.responseData as Record<string, unknown>) || {};
    const stipulations =
      (currentData.stipulations as Array<{ id: string; status: string }>) || [];

    // Update stipulation status
    const updatedStipulations = stipulations.map((s) =>
      s.id === stipulationId
        ? { ...s, status: "completed", completedAt: new Date().toISOString() }
        : s,
    );

    // Check if all stipulations are completed
    const allCompleted = updatedStipulations.every(
      (s) => s.status === "completed",
    );

    await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        status: allCompleted ? "APPROVED" : "CONDITIONAL",
        responseData: {
          ...currentData,
          stipulations: updatedStipulations,
        },
      },
    });
    await createMilestone(application.id, "stipulation_completed", {
      stipulationId,
    });
  }

  return { success: true, message: "Stipulation completed milestone recorded" };
}

/**
 * Handle funding events
 */
async function handleFundingEvent(
  eventType: "funding.approved" | "funding.completed",
  data: LightReachWebhookPayload["data"],
): Promise<{ success: boolean; message: string }> {
  const { accountId, fundingAmount } = data;

  if (!accountId) {
    return { success: false, message: "Missing accountId" };
  }

  const application = await prisma.financeApplication.findFirst({
    where: { externalApplicationId: accountId },
  });

  if (application) {
    const milestoneType =
      eventType === "funding.approved" ? "funding_approved" : "funded";

    await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        responseData: {
          ...((application.responseData as object) || {}),
          fundingAmount,
          [`${milestoneType}At`]: new Date().toISOString(),
        },
      },
    });
    await createMilestone(application.id, milestoneType as MilestoneType, {
      fundingAmount,
    });
  }

  return { success: true, message: `${eventType} milestone recorded` };
}

/**
 * Create a finance milestone
 */
async function createMilestone(
  financeApplicationId: string,
  milestoneType: MilestoneType,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    // Use type assertion since model may not be generated yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).financeMilestone.create({
      data: {
        financeApplicationId,
        milestoneType,
        status: "completed",
        completedAt: new Date(),
        metadata: metadata || {},
      },
    });

    console.log("[LightReach Webhook] Created milestone:", {
      financeApplicationId,
      milestoneType,
    });
  } catch (error) {
    // Log but don't throw - milestone creation is non-critical
    console.warn("[LightReach Webhook] Failed to create milestone:", {
      financeApplicationId,
      milestoneType,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Verify webhook signature (if LightReach provides one)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  // LightReach/Palmetto webhook signature verification
  // This should match their documentation for signature verification
  // For now, we'll do a basic check - update based on their actual implementation
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}
