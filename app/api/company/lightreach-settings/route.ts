import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

/**
 * POST /api/company/lightreach-settings
 * Save LightReach organization settings for the company
 *
 * LightReach uses organization impersonation:
 * - Platform has ONE set of API credentials (in env vars)
 * - Each company/dealer has an org alias for routing accounts
 * - Sales rep info is per-user (stored in User model)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Check if user has admin access
    if (
      session.user.role !== "COMPANY_ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { orgAlias } = body;

    // Get current company settings
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { settings: true },
    });

    const currentSettings = (company?.settings as Record<string, any>) || {};

    // Update settings with LightReach org alias (allow clearing by passing null/empty)
    const trimmedAlias = orgAlias?.trim() || null;
    const updatedSettings = {
      ...currentSettings,
      lightreach: {
        ...currentSettings.lightreach,
        orgAlias: trimmedAlias,
        configured: !!trimmedAlias, // Only configured if alias is set
        updatedAt: new Date().toISOString(),
      },
    };

    // Save to database
    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        settings: updatedSettings,
      },
    });

    console.log("[LightReachSettings] Saved org alias for company:", {
      companyId: session.user.companyId,
      orgAlias: trimmedAlias || "(cleared)",
    });

    return NextResponse.json({
      success: true,
      message: "Organization settings saved successfully",
    });
  } catch (error) {
    console.error("[LightReachSettings] Error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/company/lightreach-settings
 * Get LightReach organization settings for the company
 */
export async function GET() {
  try {
    const session = await requireAuth();

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { settings: true },
    });

    const settings = (company?.settings as Record<string, any>) || {};
    const lightreach = settings.lightreach || {};

    return NextResponse.json({
      configured: !!lightreach.configured,
      orgAlias: lightreach.orgAlias || null,
    });
  } catch (error) {
    console.error("[LightReachSettings] Error:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 },
    );
  }
}
