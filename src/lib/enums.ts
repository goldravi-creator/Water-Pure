// =====================================================================
//  Enums + labels
//  Stored as String in the database (portable across SQLite/Postgres)
//  and enforced in the application layer.
// =====================================================================

export const ROLES = [
  "OWNER",
  "MANAGER",
  "TEAM_LEAD",
  "AGENT",
  "TECHNICIAN",
  "ACCOUNTANT",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  TEAM_LEAD: "Team Lead",
  AGENT: "Agent",
  TECHNICIAN: "Technician",
  ACCOUNTANT: "Accountant",
};

export const LEAD_STATUSES = [
  "NEW",
  "AI_CALLING",
  "QUALIFIED",
  "INTERESTED",
  "HUMAN_FOLLOWUP",
  "CONVERTED",
  "NURTURE",
  "LOST",
  "DND",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  AI_CALLING: "AI Calling",
  QUALIFIED: "Qualified",
  INTERESTED: "Interested",
  HUMAN_FOLLOWUP: "Human Follow-up",
  CONVERTED: "Converted",
  NURTURE: "Nurture",
  LOST: "Lost",
  DND: "DND",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-slate-100 text-slate-700",
  AI_CALLING: "bg-blue-100 text-blue-700",
  QUALIFIED: "bg-emerald-100 text-emerald-700",
  INTERESTED: "bg-teal-100 text-teal-700",
  HUMAN_FOLLOWUP: "bg-amber-100 text-amber-800",
  CONVERTED: "bg-green-600 text-white",
  NURTURE: "bg-violet-100 text-violet-700",
  LOST: "bg-rose-100 text-rose-700",
  DND: "bg-gray-800 text-white",
};

export const SOURCES = [
  "COLD_UPLOAD",
  "WEBSITE",
  "GOOGLE_ADS",
  "META_ADS",
  "WHATSAPP",
  "MISSED_CALL",
  "REFERRAL",
  "WALKIN",
  "PARTNER",
] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  COLD_UPLOAD: "Cold DB Upload",
  WEBSITE: "Website",
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  WHATSAPP: "WhatsApp",
  MISSED_CALL: "Missed Call",
  REFERRAL: "Referral",
  WALKIN: "Walk-in",
  PARTNER: "Channel Partner",
};

export const INTENTS = [
  "NEW_INSTALL",
  "AMC",
  "REPAIR",
  "FILTER_PARTS",
  "WATER_TEST",
  "OTHER",
] as const;
export type Intent = (typeof INTENTS)[number];

export const INTENT_LABELS: Record<Intent, string> = {
  NEW_INSTALL: "New Installation",
  AMC: "AMC / Service Plan",
  REPAIR: "Repair",
  FILTER_PARTS: "Filter / Parts",
  WATER_TEST: "Water Testing",
  OTHER: "Other",
};

export const CALL_STATUSES = [
  "QUEUED",
  "RINGING",
  "IN_PROGRESS",
  "COMPLETED",
  "NO_ANSWER",
  "BUSY",
  "FAILED",
  "HANDOFF",
] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

export const DISPOSITIONS = [
  "QUALIFIED",
  "BOOKED",
  "CALLBACK",
  "NOT_INTERESTED",
  "WRONG_NUMBER",
  "NO_ANSWER",
  "HUMAN_REQUESTED",
] as const;
export type Disposition = (typeof DISPOSITIONS)[number];

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const JOB_TYPES = [
  "NEW_INSTALL",
  "AMC",
  "REPAIR",
  "FILTER_PARTS",
  "WATER_TEST",
] as const;
export const JOB_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export const PIPELINE_ORDER: LeadStatus[] = [
  "NEW",
  "AI_CALLING",
  "QUALIFIED",
  "INTERESTED",
  "HUMAN_FOLLOWUP",
  "CONVERTED",
  "NURTURE",
  "LOST",
];
