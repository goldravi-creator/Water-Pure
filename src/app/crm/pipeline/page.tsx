import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { LeadStatusBadge, SourceBadge, ScoreBadge } from "@/components/crm/status-badges";
import { PIPELINE_ORDER, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    take: 600,
    include: { assignedTo: { select: { name: true } } },
  });

  const grouped = new Map<string, typeof leads>();
  for (const s of PIPELINE_ORDER) grouped.set(s, []);
  for (const l of leads) {
    const col = grouped.get(l.status) ?? [];
    col.push(l);
    grouped.set(l.status, col);
  }
  const converted = leads.filter((l) => l.status === "CONVERTED").length;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Sales pipeline</h1>
      <p className="mb-5 mt-0.5 text-sm text-slate-500">
        {leads.length} leads · {converted} converted — automatically moved by the AI qualification engine
      </p>

      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {PIPELINE_ORDER.map((status) => {
            const col = grouped.get(status) ?? [];
            return (
              <div key={status} className="w-60 flex-none">
                <div className="mb-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                  <span className="text-xs font-semibold text-slate-700">
                    {LEAD_STATUS_LABELS[status as LeadStatus]}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                    {col.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.map((l) => (
                    <Link
                      key={l.id}
                      href={`/crm/leads/${l.id}`}
                      className="block rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-300 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">{l.name}</span>
                        <ScoreBadge score={l.score} />
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{l.phone}</div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <SourceBadge source={l.source} />
                      </div>
                      {l.assignedTo ? (
                        <div className="mt-2 text-[11px] text-slate-400">
                          👤 {l.assignedTo.name}
                        </div>
                      ) : null}
                    </Link>
                  ))}
                  {col.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      Empty
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}