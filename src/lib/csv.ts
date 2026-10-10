import Papa from "papaparse";
import { normalizePhone, isValidIndianMobile, isValidEmail } from "./dedupe";
import { isDnd } from "./dnd";

// =====================================================================
//  CSV / Excel-export ingestion
// =====================================================================

export type RawRow = Record<string, string>;

export type ParsedLead = {
  row: number;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  area?: string;
  language: string;
  source: string;
  valid: boolean;
  errors: string[];
  dnd: boolean;
};

/** Column aliases → canonical field name (case-insensitive). */
const COLUMN_ALIASES: Record<string, string> = {
  name: "name",
  "full name": "name",
  customername: "name",
  customer: "name",
  contact: "name",
  phone: "phone",
  mobile: "phone",
  "phone number": "phone",
  number: "phone",
  contactno: "phone",
  whatsapp: "phone",
  email: "email",
  "email id": "email",
  city: "city",
  location: "city",
  area: "area",
  locality: "area",
  address: "area",
  language: "language",
  lang: "language",
  source: "source",
  channel: "source",
};

function normaliseHeader(h: string): string {
  const key = h.trim().toLowerCase().replace(/[_\-]+/g, " ");
  return COLUMN_ALIASES[key] ?? key.replace(/\s+/g, "");
}

export function parseLeadCsv(csvText: string): {
  rows: ParsedLead[];
  headers: string[];
  mapping: Record<string, string>;
} {
  const result = Papa.parse<RawRow>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = result.meta.fields ?? [];
  const mapping: Record<string, string> = {};
  for (const h of headers) mapping[h] = normaliseHeader(h);

  const rows: ParsedLead[] = (result.data || []).map((raw, i) => {
    const row: RawRow = {};
    for (const [orig, canonical] of Object.entries(mapping)) {
      row[canonical] = (raw[orig] ?? "").toString().trim();
    }

    const name = row.name || row.contact || "Unknown";
    const phone = normalizePhone(row.phone || "");
    const errors: string[] = [];

    if (!phone) errors.push("Missing phone");
    else if (!isValidIndianMobile(phone)) errors.push("Invalid mobile number");
    if (row.email && !isValidEmail(row.email)) errors.push("Invalid email");

    return {
      row: i + 2, // account for header row
      name,
      phone,
      email: row.email || undefined,
      city: row.city || undefined,
      area: row.area || undefined,
      language: (row.language || "hi").toLowerCase().slice(0, 5),
      source: (row.source || "COLD_UPLOAD").toUpperCase().replace(/\s+/g, "_"),
      valid: errors.length === 0,
      errors,
      dnd: phone ? isDnd(phone) : false,
    };
  });

  return { rows, headers, mapping };
}
