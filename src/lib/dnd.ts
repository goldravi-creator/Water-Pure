// =====================================================================
//  DND (Do-Not-Disturb) scrubbing — TRAI style
//
//  In production this would call a DND registry provider API. For local
//  development we support:
//    - a configurable list via DND_LIST env (comma separated numbers)
//    - a deterministic demo rule so the feature is demonstrable
// =====================================================================

import { normalizePhone } from "./dedupe";

const ENV_LIST = (process.env.DND_LIST || "")
  .split(",")
  .map((s) => normalizePhone(s.trim()))
  .filter(Boolean);

// A few numbers permanently flagged for demo purposes.
const DEMO_DND = new Set([
  "+919000000000",
  "+919999999999",
  "+918888888888",
]);

export function isDnd(phone: string): boolean {
  const p = normalizePhone(phone);
  if (!p) return false;
  if (DEMO_DND.has(p)) return true;
  if (ENV_LIST.includes(p)) return true;
  // Demo rule: numbers ending in "0000" are treated as registered DND.
  return p.endsWith("0000");
}

export function dndReason(phone: string): string | null {
  return isDnd(phone) ? "Registered on DND registry" : null;
}
