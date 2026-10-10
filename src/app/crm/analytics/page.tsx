import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui";
import { SimpleBarChart, SimpleDonut, SimpleLineChart } from "@/components/charts";
import {
  PIPELINE_ORDER,
  LEAD_STATUS_LABELS,
  SOURCE_LABELS,
  type LeadStatus,
  type Source,
} from "@/lib/enums";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [byStatus, bySource, calls, tickets] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.call.findMany({
      select: { sentiment: true, handledByAi: true, startedAt: true },
    }),
    prisma.ticket.count(),
  ]);

  const total = byStatus.reduce((a, b) => a + b._count._all, 0) || 1;

  const funnel = PIPELINE_ORDER.map((s) => ({
    name: LEAD_STATUS_LABELS[s as LeadStatus],
    value: byStatus.find((b) => b.status === s)?._count._all ?? 0,
  })).filter((f) => f.value > 0);

  const sourceConv = bySource.map((s) => ({
    name: SOURCE_LABELS[s.source as Source] ?? s.source,
    leads: s._count._all,
  }));

  const sentimentData = [
    { name: "Positive", value: calls.filter((c) => c.sentiment === "positive").length },
    { name: "Neutral", value: calls.filter((c) => c.sentiment === "neutral").length },
    { name: "Negative", value: calls.filter((c) => c.sentiment === "negative").length },
  ];

  // 14-day call trend
  const days: { label: string; calls: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    days.push({
      label: format(d, "dd/MM"),
      calls: calls.filter((c) => c.startedAt >= d && c.startedAt < next).length,
    });
  }

  return (
    <div>
      <SectionTitle
        title="Analytics"
        description="Funnel health, channel attribution and AI performance"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Funnel by pipeline stage"
            subtitle={`${total} total leads — stages auto-maintained by the AI qualification engine`}
          />
          <CardBody>
            <SimpleBarChart data={funnel} xKey="name" barKey="value" height={260} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="AI call sentiment" subtitle={`Across ${calls.length} AI calls`} />
          <CardBody>
            <SimpleDonut data={sentimentData} nameKey="name" valueKey="value" height={260} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Call volume — last 14 days" subtitle="AI telecalling throughput" />
          <CardBody>
            <SimpleLineChart data={days} xKey="label" lineKey="calls" height={240} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Leads by channel" subtitle="Cold uploads vs online marketing sources" />
          <CardBody>
            <SimpleBarChart data={sourceConv} xKey="name" barKey="leads" height={240} />
          </CardBody>
          <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
            🎟 {tickets} human hand-off tickets created automatically by the AI.
          </div>
        </Card>
      </div>
    </div>
  );
}