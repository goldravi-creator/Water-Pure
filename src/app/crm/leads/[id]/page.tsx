import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Bot,
  MessageSquare,
  Ticket,
  Wrench,
  Activity as ActivityIcon,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, Badge, Progress, EmptyState } from "@/components/ui";
import { LeadStatusBadge, SourceBadge, IntentBadge, ScoreBadge } from "@/components/crm/status-badges";
import { LeadActions } from "@/components/crm/lead-actions";
import { safeJsonParse } from "@/lib/utils";
import type { Turn } from "@/lib/ai/agent";

export const dynamic = "force-dynamic";

type CallWithTranscript = {
  id: string;
  status: string;
  duration: number;
  summary: string | null;
  sentiment: string | null;
  disposition: string | null;
  aiScore: number | null;
  handledByAi: boolean;
  transcription?: { role: string; text: string }[];
  startedAt: Date;
  endedAt: Date | null;
};

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: { select: { name: true } },
      owner: { select: { name: true } },
      campaign: true,
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
      tickets: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" }, take: 10 },
      serviceJobs: { orderBy: { createdAt: "desc" } },
      calls: {
        orderBy: { startedAt: "desc" },
        include: { agent: { select: { name: true } } },
      },
    },
  });

  if (!lead) notFound();

  const lastCall = lead.calls[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-800">{lead.name}</h1>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><Phone size={14} /> {lead.phone}</span>
                  {lead.email ? <span className="flex items-center gap-1.5"><Mail size={14} /> {lead.email}</span> : null}
                  {lead.city || lead.area ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} /> {[lead.area, lead.city].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SourceBadge source={lead.source} />
                <IntentBadge intent={lead.intent} />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">AI qualification score</div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-brand-600">{lead.score ?? "—"}</span>
                  <div className="flex-1"><Progress value={lead.score ?? 0} /></div>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Last AI call</div>
                <div className="mt-1 text-sm font-medium text-slate-700">
                  {lastCall ? format(lastCall.startedAt, "dd MMM, h:mm a") : "Not called yet"}
                </div>
                <div className="text-xs text-slate-500">
                  {lastCall?.disposition ?? "Run the AI call below"}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Conversation summary</div>
                <div className="mt-1 text-sm font-medium text-slate-700">
                  {lastCall?.summary ?? "No summary yet"}
                </div>
              </div>
            </div>

            {lead.notes ? (
              <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <b>Notes:</b> {lead.notes}
              </div>
            ) : null}
            {lead.dnd ? (
              <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                ⚠ This number is on the DND registry — calls are blocked.
              </div>
            ) : null}
          </CardBody>
        </Card>

        {/* Call history */}
        <Card>
          <CardHeader title="AI call history" subtitle="Transcripts, sentiment & dispositions" />
          <CardBody className="space-y-4">
            {lead.calls.length === 0 ? (
              <EmptyState
                icon={<Bot size={28} />}
                title="No calls yet"
                description="Click 'Run AI call' to have the AI voice agent call this lead now."
              />
            ) : (
              lead.calls.map((c) => {
                const transcript = safeJsonParse<Turn[]>(c.transcript, []);
                return (
                  <details key={c.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
                      <Badge className="bg-brand-100 text-brand-700">AI call</Badge>
                      <span className="text-xs">{format(c.startedAt, "dd MMM, h:mm a")}</span>
                      <span className="text-xs text-slate-500">
                        {Math.floor((c.duration || 0) / 60)}:{String((c.duration || 0) % 60).padStart(2, "0")} min
                      </span>
                      <span className="text-xs text-slate-500">Sentiment: {c.sentiment ?? "—"}</span>
                      <span className="text-xs font-semibold text-brand-600">Score {c.aiScore ?? "—"}</span>
                      <span className="text-xs text-slate-500">Disposition: {c.disposition}</span>
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div className="rounded-lg bg-white p-3 text-xs text-slate-600">
                        {c.summary}
                      </div>
                      <div className="space-y-1.5">
                        {transcript.map((t, i) => (
                          <div key={i} className={`rounded-lg p-2 text-xs ${t.role === "ai" ? "bg-brand-50 text-brand-900" : "bg-slate-100 text-slate-700"}`}>
                            <span className="font-bold">{t.role === "ai" ? "AI" : "Customer"}:</span> {t.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                );
              })
            )}
          </CardBody>
        </Card>

        {/* Activity timeline */}
        <Card>
          <CardHeader title="Activity timeline" subtitle="Every event, note and AI action on this lead" />
          <CardBody>
            {lead.activities.length === 0 ? (
              <EmptyState icon={<ActivityIcon size={26} />} title="No activity yet" />
            ) : (
              <ol className="space-y-4">
                {lead.activities.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${a.type === "HANDOFF" ? "bg-amber-400" : a.type === "CALL_COMPLETED" ? "bg-brand-500" : "bg-slate-300"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{a.type}</span>
                        <span className="text-[11px] text-slate-400">{format(a.createdAt, "dd MMM, h:mm a")}</span>
                        {a.user ? <span className="text-[11px] text-slate-400">by {a.user.name}</span> : null}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{a.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>

        {/* Service jobs */}
        {lead.serviceJobs.length > 0 ? (
          <Card>
            <CardHeader title="Service jobs" subtitle="Installations, AMC, repairs" />
            <CardBody className="space-y-3">
              {lead.serviceJobs.map((j) => (
                <div key={j.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Wrench size={16} className="text-brand-500" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">{j.type}</div>
                      <div className="text-xs text-slate-500">
                        {j.scheduledAt ? format(j.scheduledAt, "dd MMM yyyy, h:mm a") : "Date TBD"} · {j.status}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-slate-100 text-slate-600">{j.amount ? `₹${j.amount}` : "—"}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        ) : null}
      </div>

      <div className="space-y-6">
        <LeadActions leadId={lead.id} initialStatus={lead.status} />

        <Card>
          <CardHeader title="Hand-off & messages" />
          <CardBody className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Ticket size={14} /> Tickets
              </div>
              {lead.tickets.length === 0 ? (
                <p className="text-xs text-slate-400">No tickets.</p>
              ) : (
                lead.tickets.slice(0, 4).map((t) => (
                  <div key={t.id} className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                    <div className="font-semibold text-amber-800">{t.subject}</div>
                    <div className="text-amber-700">{t.status} · {t.priority}</div>
                  </div>
                ))
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <MessageSquare size={14} /> WhatsApp / SMS log
              </div>
              {lead.messages.length === 0 ? (
                <p className="text-xs text-slate-400">No messages.</p>
              ) : (
                lead.messages.map((m) => (
                  <div key={m.id} className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                    <div className="text-slate-400">{m.channel} · {format(m.createdAt, "dd MMM")} · {m.direction}</div>
                    {m.body}
                  </div>
                ))
              )}
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Clock size={13} /> Best time to call: {lead.bestTime || "Not set"}</span>
              <div className="mt-1">Created: {format(lead.createdAt, "dd MMM yyyy")}</div>
              {lead.campaign ? <div className="mt-1">Campaign: {lead.campaign.name}</div> : null}
              {lead.assignedTo ? <div className="mt-1">Assigned to: {lead.assignedTo.name}</div> : <div className="mt-1">Unassigned</div>}
            </div>

            <Link href="/crm/leads" className="text-xs font-medium text-brand-600 hover:underline">
              ← Back to all leads
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}