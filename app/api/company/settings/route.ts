import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated" },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        id: true,
        name: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company, {
      headers: {
        "Cache-Control": "private, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { name, settings } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (settings !== undefined) updateData.settings = settings;

    const company = await prisma.company.update({
      where: { id: session.user.companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        settings: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error updating company settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
