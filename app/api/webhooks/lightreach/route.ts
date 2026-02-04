import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  processWebhookEvent,
  verifyWebhookSignature,
  LightReachWebhookPayload,
} from "@/lib/integrations/lightreach-webhooks";

// Type assertion helper for the webhook event model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const webhookEventModel = (prisma as any).webhookEvent;

/**
 * POST /api/webhooks/lightreach
 * Receive webhook events from LightReach/Palmetto Finance
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    let payload: LightReachWebhookPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error("[LightReach Webhook] Invalid JSON payload");
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.LIGHTREACH_WEBHOOK_SECRET;
    const signature =
      request.headers.get("x-lightreach-signature") ||
      request.headers.get("x-palmetto-signature");

    if (webhookSecret && signature) {
      try {
        const isValid = verifyWebhookSignature(
          rawBody,
          signature,
          webhookSecret,
        );
        if (!isValid) {
          console.error("[LightReach Webhook] Invalid signature");
          return NextResponse.json(
            { error: "Invalid webhook signature" },
            { status: 401 },
          );
        }
      } catch (error) {
        console.error(
          "[LightReach Webhook] Signature verification error:",
          error,
        );
        // Continue processing if verification fails due to implementation issues
        // but log it for debugging
      }
    }

    // Validate required fields
    if (!payload.eventId || !payload.eventType) {
      console.error("[LightReach Webhook] Missing required fields");
      return NextResponse.json(
        { error: "Missing eventId or eventType" },
        { status: 400 },
      );
    }

    let webhookEventId: string | null = null;

    // Try to use webhook event tracking if the model exists
    if (webhookEventModel) {
      try {
        // Check for duplicate event (idempotency)
        const existingEvent = await webhookEventModel.findUnique({
          where: { eventId: payload.eventId },
        });

        if (existingEvent) {
          console.log(
            "[LightReach Webhook] Duplicate event, skipping:",
            payload.eventId,
          );
          return NextResponse.json({
            success: true,
            message: "Event already processed",
            eventId: payload.eventId,
          });
        }

        // Store the webhook event
        const webhookEvent = await webhookEventModel.create({
          data: {
            provider: "lightreach",
            eventType: payload.eventType,
            eventId: payload.eventId,
            payload: payload as unknown as Record<string, unknown>,
          },
        });
        webhookEventId = webhookEvent.id;
      } catch (error) {
        // If webhook event model doesn't exist yet, continue without it
        console.warn(
          "[LightReach Webhook] Could not use webhook tracking:",
          error,
        );
      }
    }

    // Process the event
    let processingResult: { success: boolean; message: string };
    let processingError: string | null = null;

    try {
      processingResult = await processWebhookEvent(payload);
    } catch (error) {
      processingError =
        error instanceof Error ? error.message : "Unknown error";
      processingResult = { success: false, message: processingError };
      console.error("[LightReach Webhook] Processing error:", error);
    }

    // Update webhook event with processing result if we have one
    if (webhookEventId && webhookEventModel) {
      try {
        await webhookEventModel.update({
          where: { id: webhookEventId },
          data: {
            processedAt: processingResult.success ? new Date() : null,
            error: processingError,
          },
        });
      } catch (error) {
        console.warn(
          "[LightReach Webhook] Could not update webhook event:",
          error,
        );
      }
    }

    const processingTime = Date.now() - startTime;
    console.log("[LightReach Webhook] Completed:", {
      eventId: payload.eventId,
      eventType: payload.eventType,
      success: processingResult.success,
      processingTimeMs: processingTime,
    });

    // Always return 200 to acknowledge receipt (prevent retries for processed events)
    return NextResponse.json({
      success: processingResult.success,
      message: processingResult.message,
      eventId: payload.eventId,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("[LightReach Webhook] Unhandled error:", {
      error,
      processingTimeMs: processingTime,
    });

    // Return 500 to trigger retry from LightReach
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/webhooks/lightreach
 * Health check endpoint for webhook configuration
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    provider: "lightreach",
    timestamp: new Date().toISOString(),
  });
}
