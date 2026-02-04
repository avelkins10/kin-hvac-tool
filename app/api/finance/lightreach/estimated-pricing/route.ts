import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
  lightReachClient,
  HVACSystemDesign,
} from "@/lib/integrations/lightreach";
import {
  FinanceError,
  FinanceValidationError,
  formatFinanceError,
  logFinanceError,
} from "@/lib/integrations/finance-errors";

/**
 * POST /api/finance/lightreach/estimated-pricing
 * Get estimated pricing for HVAC before creating an account.
 * Use this to show monthly payment options in the proposal builder.
 *
 * Body:
 * - state: string (2-letter state code, required)
 * - totalFinancedAmount: number (required)
 * - systemDesign: HVACSystemDesign (optional, improves accuracy)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { state, totalFinancedAmount, systemDesign } = body;

    // Validate required fields
    if (!state || typeof state !== "string" || state.length !== 2) {
      return NextResponse.json(
        { error: "State is required and must be a 2-letter code" },
        { status: 400 },
      );
    }

    if (typeof totalFinancedAmount !== "number" || totalFinancedAmount <= 0) {
      return NextResponse.json(
        {
          error:
            "totalFinancedAmount is required and must be a positive number",
        },
        { status: 400 },
      );
    }

    console.log("[EstimatedPricing] Getting pricing:", {
      state,
      totalFinancedAmount,
      hasSystemDesign: !!systemDesign,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    // Check if test mode
    const enableTestMode = process.env.ENABLE_FINANCE_TEST_MODE === "true";
    const hasCredentials =
      !!process.env.PALMETTO_FINANCE_ACCOUNT_EMAIL &&
      !!process.env.PALMETTO_FINANCE_ACCOUNT_PASSWORD;

    if (!hasCredentials && !enableTestMode) {
      return NextResponse.json(
        {
          error: "LightReach credentials not configured",
          code: "CREDENTIALS_REQUIRED",
        },
        { status: 503 },
      );
    }

    if (enableTestMode && !hasCredentials) {
      // Return mock pricing data in test mode
      const mockProducts = generateMockPricing(totalFinancedAmount);
      return NextResponse.json({ products: mockProducts });
    }

    // Get org alias from company settings for impersonation
    let orgAlias: string | undefined;
    try {
      const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { settings: true },
      });
      const settings = (company?.settings as Record<string, any>) || {};
      orgAlias = settings.lightreach?.orgAlias;
    } catch (e) {
      // If we can't get company settings, continue without org alias
      console.warn("[EstimatedPricing] Could not get company settings:", e);
    }

    // Call LightReach API with org impersonation
    const products = await lightReachClient.getEstimatedPricing(
      state,
      totalFinancedAmount,
      systemDesign as HVACSystemDesign | undefined,
      orgAlias,
    );

    return NextResponse.json({ products });
  } catch (error) {
    logFinanceError(error, "estimated-pricing");

    if (error instanceof FinanceValidationError) {
      return NextResponse.json(
        {
          error: formatFinanceError(error),
          field: error.field,
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    if (error instanceof FinanceError) {
      return NextResponse.json(
        {
          error: formatFinanceError(error),
          code: error.code,
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        error: formatFinanceError(error),
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}

/**
 * Generate mock pricing for test mode
 */
function generateMockPricing(totalFinancedAmount: number) {
  // Comfort Plan payment factors based on term and escalator
  const plans = [
    {
      term: 10,
      escalator: 0,
      factor: 0.01546,
      name: "10 Year Comfort Plan (0% escalator)",
    },
    {
      term: 10,
      escalator: 0.99,
      factor: 0.01487,
      name: "10 Year Comfort Plan (0.99% escalator)",
    },
    {
      term: 10,
      escalator: 1.99,
      factor: 0.01416,
      name: "10 Year Comfort Plan (1.99% escalator)",
    },
    {
      term: 12,
      escalator: 0,
      factor: 0.01397,
      name: "12 Year Comfort Plan (0% escalator)",
    },
    {
      term: 12,
      escalator: 0.99,
      factor: 0.01321,
      name: "12 Year Comfort Plan (0.99% escalator)",
    },
    {
      term: 12,
      escalator: 1.99,
      factor: 0.01247,
      name: "12 Year Comfort Plan (1.99% escalator)",
    },
  ];

  return plans.map((plan, index) => {
    const monthlyPayments = [];
    let currentPayment =
      Math.round(totalFinancedAmount * plan.factor * 100) / 100;
    let totalPaid = 0;

    for (let year = 1; year <= plan.term; year++) {
      const yearlyPayment = currentPayment * 12;
      monthlyPayments.push({
        year,
        monthlyPayment: Math.round(currentPayment * 100) / 100,
        yearlyCost: Math.round(yearlyPayment * 100) / 100,
      });
      totalPaid += yearlyPayment;
      // Apply escalator for next year
      if (plan.escalator > 0) {
        currentPayment = currentPayment * (1 + plan.escalator / 100);
      }
    }

    return {
      productId: `test_product_${index + 1}`,
      name: plan.name,
      type: "lease",
      escalationRate: plan.escalator,
      termYears: plan.term,
      monthlyPayments,
      totalAmountPaid: Math.round(totalPaid * 100) / 100,
    };
  });
}
