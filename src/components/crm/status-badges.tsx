import { Badge } from "@/components/ui";
import {
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  SOURCE_LABELS,
  INTENT_LABELS,
  type LeadStatus,
  type Source,
  type Intent,
} from "@/lib/enums";

export function LeadStatusBadge({ status }: { status: string }) {
  const key = status as LeadStatus;
  return (
    <Badge className={LEAD_STATUS_COLORS[key] ?? "bg-slate-100 text-slate-700"}>
      {LEAD_STATUS_LABELS[key] ?? status}
    </Badge>
  );
}

export function SourceBadge({ source }: { source: string }) {
  const key = source as Source;
  return (
    <Badge className="bg-indigo-50 text-indigo-700">
      {SOURCE_LABELS[key] ?? source}
    </Badge>
  );
}

export function IntentBadge({ intent }: { intent?: string | null }) {
  if (!intent) return <span className="text-xs text-slate-400">—</span>;
  const key = intent as Intent;
  return (
    <Badge className="bg-teal-50 text-teal-700">
      {INTENT_LABELS[key] ?? intent}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-amber-100 text-amber-800",
    URGENT: "bg-rose-100 text-rose-700",
  };
  return <Badge className={map[priority] ?? "bg-slate-100"}>{priority}</Badge>;
}

export function ScoreBadge({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-xs text-slate-400">—</span>;
  const cls =
    score >= 70
      ? "bg-emerald-100 text-emerald-700"
      : score >= 40
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-700";
  return <Badge className={cls}>{score}</Badge>;
}
