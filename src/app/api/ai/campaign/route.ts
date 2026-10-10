import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { runCampaignLeads } from "@/lib/ai/agent";

// =====================================================================
//  Run an AI calling campaign (batch dialing)
// =====================================================================
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { campaignId, limit, status } = await req.json();
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const leads = await prisma.lead.findMany({
      where: { campaignId, status: status || "NEW" },
      take: Math.min(Number(limit) || 50, 500),
      select: { id: true },
    });

    const results = await runCampaignLeads(leads.map((l) => l.id), 3);

    const summary = {
      total: results.length,
      completed: results.filter((r) => !r.skipped && r.analysis).length,
      handoffs: results.filter((r) => r.analysis?.humanRequested).length,
      booked: results.filter((r) => r.analysis?.disposition === "BOOKED").length,
      skipped: results.filter((r) => r.skipped).length,
    };

    return NextResponse.json({ summary, results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}