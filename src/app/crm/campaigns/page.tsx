import { prisma } from "@/lib/db";
import { Card, CardHeader } from "@/components/ui";
import { CampaignManager } from "@/components/crm/campaign-manager";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">AI calling campaigns</h1>
      <p className="mb-5 mt-0.5 text-sm text-slate-500">
        Fire a campaign to have the AI voice agent call fresh leads automatically
      </p>
      <CampaignManager campaigns={campaigns} />
    </div>
  );
}