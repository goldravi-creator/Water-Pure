import Link from "next/link";
import { format } from "date-fns";
import {
  Users,
  PhoneCall,
  CheckCircle2,
  LifeBuoy,
  ArrowRight,
  Droplets,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, SectionTitle, Stat, EmptyState } from "@/components/ui";
import { LeadStatusBadge, SourceBadge } from "@/components/crm/status-badges";
import { SimpleBarChart, SimpleDonut } from "@/components/charts";
import { SOURCE_LABELS, type Source } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function CrmDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    leadsToday,
    totalCalls,
    processedCalls,
    qualified,
    converted,
    openTickets,
    recentLeads,
    bySource,
    calls7d,
    dndCount,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: today } } }),
    prisma.call.count(),
    prisma.call.count({ where: { status: { in: ["COMPLETED", "HANDOFF"] } } }),
    prisma.lead.count({
      where: { status: { in: ["QUALIFIED", "INTERESTED", "HUMAN_FOLLOWUP", "CONVERTED"] } },
    }),
    prisma.lead.count({ where: { status: "CONVERTED" } }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { assignedTo: { select: { name: true } } },
    }),
    prisma.lead.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.call.findMany({
      where: { startedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      select: { startedAt: true },
    }),
    prisma.lead.count({ where: { dnd: true } }),
  ]);

  const connectRate = totalCalls ? Math.round((processedCalls / totalCalls) * 100) : 0;

  const sourceData = bySource.map((s) => ({
    name: SOURCE_LABELS[s.source as Source] ?? s.source,
    value: s._count._all,
  }));

  // Last 7 days call volume
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    days.push({
      label: format(d, "EEE"),
      count: calls7d.filter((c) => c.startedAt >= d && c.startedAt < next).length,
    });
  }

  return (
    <div>
      <SectionTitle
        title="Dashboard"
        description="Every cold-call and online lead — in one panel, automated by AI."
        right={
          <Link
            href="/crm/leads/import"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Droplets size={15} /> Import &amp; Run AI
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Stat label="Total Leads" value={totalLeads} icon={<Users size={15} />} />
        <Stat label="Leads Today" value={leadsToday} tone="green" icon={<Users size={15} />} />
        <Stat label="AI Calls Made" value={totalCalls} tone="violet" icon={<PhoneCall size={15} />} />
        <Stat
          label="Connect Rate"
          value={`${connectRate}%`}
          tone="amber"
          icon={<PhoneCall size={15} />}
        />
        <Stat label="Qualified" value={qualified} tone="green" icon={<CheckCircle2 size={15} />} />
        <Stat
          label="Open Tickets"
          value={openTickets}
          tone="rose"
          icon={<LifeBuoy size={15} />}
          hint={`${dndCount} DND skipped`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="AI call volume — last 7 days"
            subtitle={`${processedCalls} calls processed by the AI voice agent`}
          />
          <CardBody>
            <SimpleBarChart data={days} xKey="label" barKey="count" height={220} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Leads by source" subtitle="Cold-call vs online marketing" />
          <CardBody>
            <SimpleDonut data={sourceData} nameKey="name" valueKey="value" height={230} />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Recent leads"
          subtitle="Newest enquiries across all channels"
          action={
            <Link href="/crm/leads" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          }
        />
        {recentLeads.length === 0 ? (
          <EmptyState
            title="No leads yet"
            description="Import a CSV or wait for website enquiries to appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>AI Score</th>
                  <th>Assignee</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link className="font-medium text-brand-600 hover:underline" href={`/crm/leads/${l.id}`}>
                        {l.name}
                      </Link>
                    </td>
                    <td className="text-xs">{l.phone}</td>
                    <td><SourceBadge source={l.source} /></td>
                    <td><LeadStatusBadge status={l.status} /></td>
                    <td>{l.score ?? "—"}</td>
                    <td>{l.assignedTo?.name ?? "Unassigned"}</td>
                    <td className="text-xs">{format(l.createdAt, "dd MMM, h:mm a")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}