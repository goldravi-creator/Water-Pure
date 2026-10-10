import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone, isValidIndianMobile } from "@/lib/dedupe";
import { isDnd } from "@/lib/dnd";
import { processNewLead } from "@/lib/automation";

// =====================================================================
//  Public lead capture — website forms, landing pages, ads
// =====================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const rawPhone = String(body.phone || "").trim();
    const phone = normalizePhone(rawPhone);

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }
    if (!isValidIndianMobile(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number" },
        { status: 400 }
      );
    }

    const dnd = isDnd(phone);

    // Upsert by phone (dedupe)
    const existing = await prisma.lead.findUnique({ where: { phone } });
    if (existing) {
      await prisma.activity.create({
        data: {
          leadId: existing.id,
          type: "RE_ENQUIRY",
          note: `New enquiry from ${body.source || "WEBSITE"}.`,
        },
      });
      return NextResponse.json({ ok: true, leadId: existing.id, existing: true });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email: body.email ? String(body.email) : null,
        city: body.city ? String(body.city) : null,
        area: body.area ? String(body.area) : null,
        language: body.language ? String(body.language) : "hi",
        source: body.source ? String(body.source) : "WEBSITE",
        intent: body.intent ? String(body.intent) : null,
        consent: true,
        dnd,
        bestTime: body.bestTime ? String(body.bestTime) : null,
        notes: body.message ? String(body.message) : null,
        status: "NEW",
      },
    });

    // Kick off the automation chain (AI call, scoring, follow-up)
    try {
      await processNewLead(lead.id);
    } catch {
      // Lead is safely stored even if automation fails.
    }

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
