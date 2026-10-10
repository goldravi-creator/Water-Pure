import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui";
import { safeJsonParse } from "@/lib/utils";
import type { Turn } from "@/lib/ai/agent";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const calls = await prisma.call.findMany({
    orderBy: { startedAt: "desc" },
    take: 60,
    include: {
      lead: { select: { id: true, name: true, phone: true, score: true } },
      agent: { select: { name: true } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">AI calls</h1>
      <p className="mb-5 mt-0.5 text-sm text-slate-500">
        Every call the AI voice agent has made — click to read the full transcript
      </p>

      <Card>
        <CardHeader title="Call log" subtitle={`${calls.length} most recent calls`} />
        {calls.length === 0 ? (
          <EmptyState
            title="No calls yet"
            description="Run the AI call on any lead or start a campaign from the Campaigns page."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Status</th>
                  <th>Sentiment</th>
                  <th>Disposition</th>
                  <th>Score</th>
                  <th>Duration</th>
                  <th>Summary</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => {
                  const transcript = safeJsonParse<Turn[]>(c.transcript, []);
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/crm/leads/${c.leadId}`} className="font-medium text-brand-600 hover:underline">
                          {c.lead.name}
                        </Link>
                        <div className="text-xs text-slate-400">{c.lead.phone}</div>
                      </td>
                      <td>
                        <Badge className={c.status === "HANDOFF" ? "bg-amber-100 text-amber-800" : c.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                          {c.status}
                        </Badge>
                      </td>
                      <td>
                        <Badge className={c.sentiment === "positive" ? "bg-emerald-50 text-emerald-700" : c.sentiment === "negative" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}>
                          {c.sentiment ?? "—"}
                        </Badge>
                      </td>
                      <td className="text-xs">{c.disposition ?? "—"}</td>
                      <td>{c.aiScore ?? "—"}</td>
                      <td className="text-xs">
                        {Math.floor((c.duration || 0) / 60)}:{String((c.duration || 0) % 60).padStart(2, "0")}
                      </td>
                      <td className="max-w-[260px] text-xs text-slate-500">
                        <details>
                          <summary className="cursor-pointer text-brand-600">Summary</summary>
                          <p className="mt-1">{c.summary}</p>
                          {transcript.length ? (
                            <div className="mt-2 space-y-1">
                              {transcript.map((t, i) => (
                                <div key={i} className={t.role === "ai" ? "font-medium text-brand-700" : "text-slate-600"}>
                                  <b>{t.role === "ai" ? "AI" : "Cust"}:</b> {t.text}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </details>
                      </td>
                      <td className="text-xs">{format(c.startedAt, "dd MMM, h:mm a")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}