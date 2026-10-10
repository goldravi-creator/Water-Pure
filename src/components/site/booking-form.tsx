"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { INTENTS, INTENT_LABELS, type Intent } from "@/lib/enums";

export function BookingForm({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    area: "",
    intent: "NEW_INSTALL" as Intent,
    message: "",
    bestTime: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.phone) {
      setError("Please enter your name and phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "WEBSITE" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Something went wrong");
      }
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card-surface flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="text-emerald-500" size={44} />
        <h3 className="text-lg font-bold text-slate-800">Request received!</h3>
        <p className="max-w-sm text-sm text-slate-500">
          Thank you, {form.name.split(" ")[0]}. Our AI assistant will call you
          shortly to confirm the details. You can also reach us at{" "}
          {process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91-90000-00000"}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card-surface space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name *"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Rahul Sharma"
        />
        <Input
          label="Mobile number *"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="98765 43210"
          inputMode="tel"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email (optional)"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="you@example.com"
        />
        <Select
          label="What do you need?"
          value={form.intent}
          onChange={(e) => set("intent", e.target.value)}
        >
          {INTENTS.map((i) => (
            <option key={i} value={i}>
              {INTENT_LABELS[i]}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="City"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder="e.g. Lucknow"
        />
        <Input
          label="Area / Locality"
          value={form.area}
          onChange={(e) => set("area", e.target.value)}
          placeholder="e.g. Gomti Nagar"
        />
      </div>
      {!compact && (
        <Textarea
          label="Anything specific? (optional)"
          rows={3}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Tell us about your RO / issue / preferred time"
        />
      )}
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? <Loader2 className="animate-spin" size={16} /> : null}
        {loading ? "Submitting…" : "Request my service call"}
      </Button>
      <p className="text-center text-[11px] text-slate-400">
        By submitting you agree to be contacted about RO services.
      </p>
    </form>
  );
}
