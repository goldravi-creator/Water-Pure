"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, Plus, Megaphone } from "lucide-react";
import { Button, Card, CardBody, CardHeader, Input, Select, Textarea } from "@/components/ui";

type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  script: string | null;
  _count: { leads: number };
};

export function CampaignManager({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", channel: "OUTBOUND", dailyLimit: "300", script: "" });

  async function createCampaign() {
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", channel: "OUTBOUND", dailyLimit: "300", script: "" });
      router.refresh();
    }
  }

  async function runCampaign(campaignId: string) {
    setBusyId(campaignId);
    setRunSummary((s) => ({ ...s, [campaignId]: "Running AI calls…" }));
    try {
      const res = await fetch("/api/ai/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, limit: 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const s = data.summary;
      setRunSummary((prev) => ({
        ...prev,
        [campaignId]: `✅ ${s.completed} calls · ${s.handoffs} hand-offs · ${s.booked} bookings`,
      }));
    } catch (e) {
      setRunSummary((prev) => ({ ...prev, [campaignId]: `❌ ${(e as Error).message}` }));
    } finally {
      setBusyId(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus size={15} /> New campaign
        </Button>
      </div>

      {showForm ? (
        <Card>
          <CardHeader title="Create AI calling campaign" subtitle="Leads you import can be attached to this campaign" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input label="Campaign name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Gomti Nagar cold-call" />
            <Select label="Channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <option value="OUTBOUND">Outbound cold calling</option>
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="META_ADS">Meta Ads</option>
              <option value="WHATSAPP">WhatsApp blast</option>
            </Select>
            <Input label="Daily call limit" type="number" value={form.dailyLimit} onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })} />
            <div className="sm:col-span-2">
              <Textarea label="AI script / instructions (optional)" rows={4} value={form.script} onChange={(e) => setForm({ ...form, script: e.target.value })} placeholder="e.g. Focus on AMC plans for customers with purifiers older than 2 years…" />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={createCampaign}>Save campaign</Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Campaigns" subtitle="Each campaign can be fired to have the AI agent call all its fresh leads" />
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Leads</th>
                <th>Status</th>
                <th>Daily limit</th>
                <th>Result</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No campaigns yet — create one to start AI calling.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium text-slate-700">{c.name}</td>
                    <td className="flex items-center gap-1.5 text-xs"><Megaphone size={13} className="text-brand-500" /> {c.channel}</td>
                    <td>{c._count.leads}</td>
                    <td className="text-xs">{c.status}</td>
                    <td className="text-xs">{c.script ? "custom" : "outbound"}</td>
                    <td className="max-w-[220px] text-xs text-slate-500">{runSummary[c.id] ?? "—"}</td>
                    <td>
                      <Button size="sm" onClick={() => runCampaign(c.id)} disabled={busyId === c.id}>
                        {busyId === c.id ? <Loader2 className="animate-spin" size={14} /> : <Bot size={14} />}
                        {busyId === c.id ? "Calling…" : "Run AI calls"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}