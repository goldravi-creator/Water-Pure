// =====================================================================
//  Lead qualification & scoring model
//  (mirrors section 9 of the blueprint)
// =====================================================================

import type { Intent } from "./enums";

export type QualSignals = {
  intent?: Intent | null;
  areaMatch?: boolean;
  sentiment?: "positive" | "neutral" | "negative";
  offerAccepted?: boolean;
  urgency?: "high" | "medium" | "low";
  engaged?: boolean;
};

export type ScoreBreakdown = {
  score: number;
  band: "HOT" | "WARM" | "COLD";
  parts: { label: string; points: number }[];
};

export function computeScore(s: QualSignals): ScoreBreakdown {
  const parts: { label: string; points: number }[] = [];

  const intentPoints = s.intent && s.intent !== "OTHER" ? 30 : 8;
  parts.push({ label: `Intent (${s.intent ?? "unknown"})`, points: intentPoints });

  const areaPoints = s.areaMatch ? 20 : 5;
  parts.push({ label: "Service area match", points: areaPoints });

  const sentPoints = s.sentiment === "positive" ? 20 : s.sentiment === "neutral" ? 10 : 0;
  parts.push({ label: "Sentiment / engagement", points: sentPoints });

  const offerPoints = s.offerAccepted ? 15 : 0;
  parts.push({ label: "Offer acceptance", points: offerPoints });

  const urgencyPoints = s.urgency === "high" ? 15 : s.urgency === "medium" ? 8 : 3;
  parts.push({ label: `Urgency (${s.urgency ?? "low"})`, points: urgencyPoints });

  const raw = parts.reduce((a, b) => a + b.points, 0);
  const score = Math.max(0, Math.min(100, raw));
  const band = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";
  return { score, band, parts };
}

export function statusFromScore(score: number): "QUALIFIED" | "NURTURE" | "LOST" {
  if (score >= 70) return "QUALIFIED";
  if (score >= 40) return "NURTURE";
  return "LOST";
}
