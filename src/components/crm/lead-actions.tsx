"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneCall, TicketPlus, CalendarCheck, StickyNote } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import {
  INTENTS,
  INTENT_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type Intent,
  type LeadStatus,
} from "@/lib/enums";

export function LeadActions({
  leadId,
  initialStatus,
}: {
  leadId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [jobType, setJobType] = useState<Intent>("REPAIR");
  const [status, setStatus] = useState(initialStatus);

  async function patchStatus(next: string) {
    if (next === status) return;
    setBusy("status");
    setMsg(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, note: `Status changed to ${next}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setStatus(next);
      setMsg({ ok: true, text: "Status updated ✓" });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  async function run(functionName: string, url: string, body: Record<string, unknown>) {
    setBusy(functionName);
    setMsg(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMsg({ ok: true, text: data.summary || data.message || "Done ✓" });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  return (
    <div className="card-surface p-4">
      <h3 className="text-sm font-semibold text-slate-800">Automation actions</h3>
      <p className="mt-0.5 text-xs text-slate-500">
        AI telecalling, human hand-off and booking — all in one tap.
      </p>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <label className="label">Pipeline status</label>
        <Select
          value={status}
          onChange={(e) => patchStatus(e.target.value)}
          disabled={!!busy}
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s as LeadStatus]}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => run("call", "/api/ai/call", { leadId })}
          disabled={!!busy}
          variant={busy === "call" ? "secondary" : "primary"}
        >
          <PhoneCall size={15} />
          {busy === "call" ? "Calling…" : "Run AI call"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => run("ticket", "/api/tickets", { leadId, subject: "Human hand-off requested", priority: "HIGH" })}
          disabled={!!busy}
        >
          <TicketPlus size={15} />
          {busy === "ticket" ? "Creating…" : "Hand-off ticket"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowNote((s) => !s)}
          disabled={!!busy}
        >
          <StickyNote size={15} /> Add note
        </Button>
      </div>

      {showNote ? (
        <div className="mt-3 space-y-2">
          <Textarea
            rows={2}
            placeholder="Write a note for this lead…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!note.trim() || !!busy}
            onClick={() =>
              run("note", `/api/leads/${leadId}/activity`, { note })
                .then(() => setNote(""))
            }
          >
            Save note
          </Button>
        </div>
      ) : null}

      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
          <CalendarCheck size={14} /> Book a service (converts lead → customer)
        </div>
        <div className="flex gap-2">
          <Select value={jobType} onChange={(e) => setJobType(e.target.value as Intent)} className="w-48">
            {INTENTS.map((i) => (
              <option key={i} value={i}>
                {INTENT_LABELS[i]}
              </option>
            ))}
          </Select>
          <Button
            size="md"
            variant="success"
            disabled={!!busy}
            onClick={() => run("book", `/api/leads/${leadId}/book`, { type: jobType })}
          >
            {busy === "book" ? "Booking…" : "Book service"}
          </Button>
        </div>
      </div>

      {msg ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
          }`}
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}