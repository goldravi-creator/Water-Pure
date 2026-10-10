"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Bot,
} from "lucide-react";
import { Button, Card, CardBody, CardHeader, Select, Textarea } from "@/components/ui";

type ImportResult = {
  total: number;
  invalid: number;
  duplicates: number;
  imported: number;
  dndSkipped: number;
  aiQueued: number;
};

const SAMPLE_CSV = `full name,phone,email,city,area
Rahul Sharma,9876543210,rahul@example.com,Lucknow,Gomti Nagar
Priya Verma,9123456780,priya@example.com,Delhi,Rajouri Garden
Amit Singh,9988776655,,Noida,Sector 62
Sneha Gupta,9345678901,sneha@example.com,Jaipur,Malviya Nagar`;

export default function ImportPage() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [source, setSource] = useState("COLD_UPLOAD");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setCsv(text);
  }

  async function runImport() {
    setError(null);
    setResult(null);
    if (!csv.trim()) {
      setError("Paste CSV content or choose a file first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Import lead database</h1>
      <p className="mb-5 mt-0.5 text-sm text-slate-500">
        Upload a CSV/Excel export of your cold-call list. The system auto-cleans it:
        validation → de-duplication → DND scrubbing → unified pipeline.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="1 · Choose your file"
            subtitle="Columns are mapped automatically (name, phone, email, city, area…)"
          />
          <CardBody className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center hover:border-brand-400">
              <FileSpreadsheet size={28} className="text-brand-500" />
              <span className="text-sm font-medium text-slate-600">
                {fileName ?? "Click to choose CSV file"}
              </span>
              <span className="text-xs text-slate-400">.csv files · Excel exports saved as CSV</span>
              <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
            </label>

            <Textarea
              label="…or paste CSV data directly"
              rows={6}
              placeholder={SAMPLE_CSV}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              className="font-mono text-xs"
            />

            <Select label="Lead source" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="COLD_UPLOAD">Cold DB Upload (telecalling list)</option>
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="META_ADS">Meta Ads</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PARTNER">Channel Partner</option>
            </Select>

            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
            ) : null}
            <Button onClick={runImport} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
              {loading ? "Importing…" : "Import & clean"}
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="2 · Result & next step" subtitle="See what the pipeline accepted" />
          <CardBody>
            {!result ? (
              <div className="space-y-3 text-sm text-slate-500">
                <p>Import preview will appear here.</p>
                <div className="rounded-lg bg-slate-50 p-4 text-xs leading-relaxed">
                  <b>Automatic cleaning pipeline:</b>
                  <ol className="mt-2 list-decimal space-y-1 pl-4">
                    <li>Parse + validate every row</li>
                    <li>De-duplicate (same phone within file &amp; database)</li>
                    <li>Scrub against DND registry</li>
                    <li>Map to the unified lead pipeline</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ["Total rows", result.total, "bg-slate-100 text-slate-700"],
                    ["Imported", result.imported, "bg-emerald-100 text-emerald-700"],
                    ["Duplicates", result.duplicates, "bg-amber-100 text-amber-800"],
                    ["Invalid", result.invalid, "bg-rose-100 text-rose-700"],
                    ["DND skipped", result.dndSkipped, "bg-gray-200 text-gray-700"],
                  ].map(([label, value, cls]) => (
                    <div key={label} className={`rounded-xl p-4 text-center ${cls}`}>
                      <div className="text-2xl font-extrabold">{value}</div>
                      <div className="text-xs font-medium">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="success" onClick={() => router.push("/crm/campaigns")}>
                    <Bot size={16} /> Start AI calling campaign
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/crm/leads")}>
                    View leads
                  </Button>
                </div>
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  New leads are queued — run a campaign to have the AI agent call them.
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="mb-2 text-xs font-semibold text-slate-600">Sample CSV format</div>
              <textarea
                readOnly
                rows={5}
                value={SAMPLE_CSV}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-500"
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}