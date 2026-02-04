import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

interface ClientData {
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const where: any = {};

    // Company isolation
    if (session.user.role === "SUPER_ADMIN") {
      const companyId = new URL(request.url).searchParams.get("companyId");
      if (companyId) {
        where.companyId = companyId;
      }
    } else {
      where.companyId = session.user.companyId;
    }

    // User filter - Sales reps only see their own proposals
    if (session.user.role === "SALES_REP") {
      where.userId = session.user.id;
    }

    // Get all proposals with customer data
    const proposals = await prisma.proposal.findMany({
      where,
      select: {
        id: true,
        customerData: true,
        totals: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Aggregate clients by email
    const clientsMap = new Map<
      string,
      {
        email: string;
        name?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
        proposals: any[];
        totalValue: number;
        lastProposalDate: string;
      }
    >();

    proposals.forEach((proposal) => {
      const customerData = proposal.customerData as ClientData | null;
      if (!customerData?.email) return;

      const email = customerData.email.toLowerCase();
      const totals = proposal.totals as any;
      const proposalValue = totals?.total || 0;

      if (clientsMap.has(email)) {
        const client = clientsMap.get(email)!;
        client.proposals.push(proposal);
        client.totalValue += proposalValue;
        if (new Date(proposal.createdAt) > new Date(client.lastProposalDate)) {
          client.lastProposalDate = proposal.createdAt.toISOString();
        }
      } else {
        clientsMap.set(email, {
          email: customerData.email,
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
          zip: customerData.zip,
          proposals: [proposal],
          totalValue: proposalValue,
          lastProposalDate: proposal.createdAt.toISOString(),
        });
      }
    });

    // Convert map to array and sort by last proposal date
    const clients = Array.from(clientsMap.values()).sort((a, b) => {
      return (
        new Date(b.lastProposalDate).getTime() -
        new Date(a.lastProposalDate).getTime()
      );
    });

    return NextResponse.json(
      { clients },
      {
        headers: {
          "Cache-Control": "private, s-maxage=30, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
