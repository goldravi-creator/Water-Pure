"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { SOURCES, SOURCE_LABELS, INTENTS, INTENT_LABELS, type Source, type Intent } from "@/lib/enums";

export default function NewLeadPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    area: "",
    source: "COLD_UPLOAD" as Source,
    intent: "" as Intent | "",
    language: "hi",
    notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create lead");
      router.push(`/crm/leads/${data.lead.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-slate-800">Add a lead</h1>
      <p className="mb-5 mt-0.5 text-sm text-slate-500">
        Manually capture a walk-in, reference or any offline lead.
      </p>

      <form onSubmit={submit} className="card-surface space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name *" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Mobile *" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98765 43210" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input label="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Area" value={form.area} onChange={(e) => set("area", e.target.value)} />
          <Select label="Source" value={form.source} onChange={(e) => set("source", e.target.value)}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Intent (optional)" value={form.intent} onChange={(e) => set("intent", e.target.value)}>
            <option value="">— Not specified —</option>
            {INTENTS.map((i) => (
              <option key={i} value={i}>{INTENT_LABELS[i]}</option>
            ))}
          </Select>
          <Select label="Language" value={form.language} onChange={(e) => set("language", e.target.value)}>
            <option value="hi">Hindi / Hinglish</option>
            <option value="en">English</option>
          </Select>
        </div>
        <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save lead"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}