import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone, isValidIndianMobile } from "@/lib/dedupe";
import { retrieveKnowledge } from "@/lib/ai/knowledge";

// =====================================================================
//  Website AI chatbot
//  Rule + knowledge-base driven. Can capture a lead when a phone number
//  is detected, and offers a human hand-off.
// =====================================================================

function detectPhone(text: string): string | null {
  const m = text.replace(/[^\d]/g, "");
  const match = text.match(/(?:\+?91[\s-]?)?[6-9]\d{9}/);
  if (match) {
    const p = normalizePhone(match[0]);
    if (isValidIndianMobile(p)) return p;
  }
  if (m.length === 10 && /^[6-9]/.test(m)) {
    const p = normalizePhone(m);
    if (isValidIndianMobile(p)) return p;
  }
  return null;
}

function detectIntent(text: string): string | null {
  const t = text.toLowerCase();
  if (/(install|new ro|lagana|buy|purchase|naya)/.test(t)) return "NEW_INSTALL";
  if (/(amc|maintenance|annual|plan|service plan)/.test(t)) return "AMC";
  if (/(repair|not working|kharab|problem|leak|issue)/.test(t)) return "REPAIR";
  if (/(filter|membrane|part|cartridge)/.test(t)) return "FILTER_PARTS";
  if (/(test|tds|quality)/.test(t)) return "WATER_TEST";
  return null;
}

async function buildReply(message: string, phone: string | null) {
  const t = message.toLowerCase();

  if (/(human|person|agent|insaan|talk to|manager|call me|baat)/.test(t)) {
    return "Of course! I've noted your request — a human service expert will call you shortly. You can also reach us directly on our helpline. 🙂";
  }

  if (phone) {
    return `Thank you! I've registered your number (${phone}). Our AI assistant will call you shortly to confirm your requirement and a convenient time slot.`;
  }

  if (/(price|cost|charge|kitna|rate|paisa|fees)/.test(t)) {
    const kb = await retrieveKnowledge("price cost AMC charge");
    return (
      (kb[0]?.content ||
        "Our AMC plans start from ₹1,999/year. A service visit is ₹499 (parts extra). New RO installation starts from ₹8,999.") +
      " Would you like me to arrange a callback? Please share your mobile number."
    );
  }

  if (/(amc|maintenance|annual|plan)/.test(t)) {
    return "We offer three AMC plans: Basic ₹1,999/yr, Standard ₹3,499/yr and Premium ₹5,999/yr — all include scheduled visits and genuine filters. Share your number and I'll have our team explain the best fit.";
  }

  if (/(area|city|available|serviceable|location)/.test(t)) {
    return "We serve most urban areas. Tell me your city/locality and your mobile number, and I'll confirm coverage and a slot right away.";
  }

  const kb = await retrieveKnowledge(message);
  if (kb.length) {
    return `${kb[0].content} — Anything else you'd like to know? Share your number for a callback.`;
  }

  return "I can help with RO installation, servicing, AMC plans, repairs and water testing. Could you share your requirement and mobile number so our team can assist you?";
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ reply: "Please type a message." });

    const phone = detectPhone(String(message));
    const reply = await buildReply(String(message), phone);

    let lead: { name?: string; phone?: string } | undefined;

    if (phone) {
      const existing = await prisma.lead.findUnique({ where: { phone } });
      if (!existing) {
        const created = await prisma.lead.create({
          data: {
            name: "Website Chat Lead",
            phone,
            source: "WEBSITE",
            intent: detectIntent(String(message)),
            consent: true,
            status: "NEW",
            notes: `Chat: ${String(message).slice(0, 480)}`,
          },
        });
        await prisma.activity.create({
          data: {
            leadId: created.id,
            type: "LEAD_CREATED",
            note: "Captured via website chatbot",
          },
        });
      }
      lead = { phone };
    }

    return NextResponse.json({ reply, lead });
  } catch (e) {
    return NextResponse.json({ reply: "Sorry, please try again." }, { status: 200 });
  }
}
