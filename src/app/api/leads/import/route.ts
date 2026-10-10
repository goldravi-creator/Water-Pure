import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseLeadCsv } from "@/lib/csv";
import { normalizePhone } from "@/lib/dedupe";

// =====================================================================
//  CSV / Excel-export import with de-duplication & DND scrubbing
// =====================================================================
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { csv, source, runAi } = await req.json();
    if (!csv || !String(csv).trim()) {
      return NextResponse.json({ error: "CSV content required" }, { status: 400 });
    }

    const { rows, headers, mapping } = parseLeadCsv(String(csv));

    // De-duplicate within the file AND against the database
    const seen = new Set<string>();
    const unique = rows.filter((r) => {
      if (!r.phone) return false;
      const key = r.phone;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const existing = await prisma.lead.findMany({
      where: { phone: { in: unique.map((r) => r.phone) } },
      select: { phone: true },
    });
    const existingSet = new Set(existing.map((e) => e.phone));
    const fresh = unique.filter((r) => !existingSet.has(r.phone));

    let imported = 0;
    let dndSkipped = 0;
    if (fresh.length) {
      for (const r of fresh) {
        if (r.dnd) {
          dndSkipped++;
          continue;
        }
        await prisma.lead.create({
          data: {
            name: r.name,
            phone: r.phone,
            email: r.email || null,
            city: r.city || null,
            area: r.area || null,
            language: r.language,
            source: r.source || source || "COLD_UPLOAD",
            dnd: r.dnd,
            status: "NEW",
          },
        });
        imported++;
      }
    }

    // Optionally kick off the AI calling flow for fresh leads
    let aiQueued = 0;
    if (runAi) {
      const leads = await prisma.lead.findMany({
        where: { status: "NEW", source: source || "COLD_UPLOAD" },
        orderBy: { createdAt: "asc" },
      });
      // Non-blocking: hand off to /api/ai/campaign instead for large batches.
      aiQueued = leads.length;
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      invalid: rows.length - unique.length,
      duplicates: unique.length - fresh.length,
      imported,
      dndSkipped,
      aiQueued,
      headers,
      mapping,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}