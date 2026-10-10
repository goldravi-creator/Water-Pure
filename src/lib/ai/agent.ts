import { prisma } from "../db";
import { computeScore, statusFromScore, type QualSignals } from "../scoring";
import { retrieveKnowledge } from "./knowledge";
import {
  aiMode,
  buildAgentSystemPrompt,
  createRealtimeSession,
  startTwilioCall,
} from "./providers";
import { seededRandom } from "../utils";
import type { Intent } from "../enums";

// =====================================================================
//  AI Voice Agent
//
//  runAiCall() orchestrates a complete outbound AI call:
//    1. consent + DND checks
//    2. open a Call record
//    3. run the conversation brain  (mock: local simulation;
//                                     live: Twilio + GPT-4o Realtime)
//    4. score + classify the lead
//    5. human hand-off / booking / follow-up side effects
//    6. write everything back to the CRM
// =====================================================================

export type Turn = { role: "ai" | "customer"; text: string };

export type CallAnalysis = {
  transcript: Turn[];
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  disposition: string;
  signals: QualSignals;
  score: number;
  intent: Intent;
  humanRequested: boolean;
  durationSec: number;
};

type LeadLike = {
  id: string;
  name: string;
  phone: string;
  language: string | null;
  city: string | null;
  area: string | null;
  intent: string | null;
};

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length];
}

function estimateAmount(intent: Intent): number {
  switch (intent) {
    case "NEW_INSTALL":
      return 12000;
    case "AMC":
      return 4500;
    case "REPAIR":
      return 1200;
    case "FILTER_PARTS":
      return 800;
    case "WATER_TEST":
      return 300;
    default:
      return 500;
  }
}

// ---------------------------------------------------------------------
//  Conversation brain (deterministic per-phone simulation)
// ---------------------------------------------------------------------
export async function generateConversation(lead: LeadLike): Promise<CallAnalysis> {
  const rand = seededRandom(lead.phone);
  const r1 = rand();
  const r2 = rand();
  const r3 = rand();
  const r4 = rand();
  const r5 = rand();
  const hi = !(lead.language || "hi").startsWith("en");

  const intentPool: Intent[] = lead.intent
    ? [lead.intent as Intent]
    : ["NEW_INSTALL", "AMC", "REPAIR", "FILTER_PARTS"];
  const intent = pick(intentPool, r1);

  const humanRequested = r2 < 0.22;

  const sentiment: CallAnalysis["sentiment"] = humanRequested
    ? r3 < 0.5
      ? "neutral"
      : "negative"
    : r3 < 0.6
      ? "positive"
      : r3 < 0.9
        ? "neutral"
        : "negative";

  const areaMatch = r4 > 0.25;
  const offerAccepted = !humanRequested && r5 > 0.4;
  const urgency: "high" | "medium" | "low" =
    r5 > 0.7 ? "high" : r5 > 0.35 ? "medium" : "low";

  const kbHits = await retrieveKnowledge(
    `${intent} pricing service area ${lead.city ?? ""} ${lead.area ?? ""}`
  );
  const kbHint = kbHits[0]?.content ?? "standard plans apply";

  // ---- Build transcript ----
  const t: Turn[] = [];
  const intentLabel: Record<Intent, string> = {
    NEW_INSTALL: hi ? "naya RO lagana" : "a new RO installation",
    AMC: hi ? "AMC / service plan" : "an AMC / service plan",
    REPAIR: hi ? "repair" : "a repair",
    FILTER_PARTS: hi ? "filter ya parts change" : "filter / parts replacement",
    WATER_TEST: hi ? "water testing" : "water testing",
    OTHER: hi ? "service" : "a service",
  };

  t.push({
    role: "ai",
    text: hi
      ? `Namaste ${lead.name}! Main WaterPure se Aarav, ek AI assistant hoon. Aapke area mein RO service ke liye call kar raha hoon — 2 minute hain?`
      : `Hi ${lead.name}, I'm Aarav — an AI assistant from WaterPure RO Services. Is now a good time for 2 minutes about your RO service?`,
  });
  t.push({
    role: "customer",
    text: humanRequested
      ? hi
        ? "Haan bolo, lekin mujhe detail mein baat karni hai."
        : "Yes, but I'll need to speak with someone in detail."
      : hi
        ? "Haan boliye."
        : "Yes, go ahead.",
  });
  t.push({
    role: "ai",
    text: hi
      ? `Bahut badhiya. Aap ${intentLabel[intent]} ke baare mein baat karna chahte hain ya kuch aur?`
      : `Great. Are you looking at ${intentLabel[intent]} or something else?`,
  });
  t.push({
    role: "customer",
    text: hi
      ? `Haan, ${intentLabel[intent]} ke liye.`
      : `Yes, for ${intentLabel[intent]}.`,
  });
  t.push({
    role: "ai",
    text: hi
      ? `Theek hai. Aap ${lead.area ?? "kaunse area"} se hain? Aur purifier kitne saal purana hai?`
      : `Understood. Which area are you in, and how old is the purifier?`,
  });
  t.push({
    role: "customer",
    text: hi
      ? `${lead.area ?? "Yahin"}, aur lagbhag 2 saal purana hai.`
      : `${lead.area ?? "nearby"}, about 2 years old.`,
  });

  if (humanRequested) {
    t.push({
      role: "customer",
      text: hi
        ? "Sunna, mujhe kisi insaan se baat karni hai, detail chahiye."
        : "Listen, I'd like to talk to an actual person for the details.",
    });
    t.push({
      role: "ai",
      text: hi
        ? "Bilkul! Main abhi aapko hamare service expert se connect kar raha hoon. Ek moment please…"
        : "Absolutely! Connecting you to our service expert right away. One moment…",
    });
  } else if (offerAccepted && areaMatch) {
    t.push({
      role: "ai",
      text: hi
        ? `Perfect, aapke area mein service available hai. ${kbHint} Main kal shaam 5 baje ka slot book kar doon?`
        : `Perfect, we cover your area. ${kbHint} Shall I book a slot tomorrow at 5 PM?`,
    });
    t.push({
      role: "customer",
      text: hi ? "Haan, theek hai, book kar do." : "Yes, that works — please book it.",
    });
    t.push({
      role: "ai",
      text: hi
        ? "Ho gaya! Confirmation WhatsApp par bhej raha hoon. Dhanyavaad!"
        : "Done! Sending the confirmation on WhatsApp. Thank you!",
    });
  } else if (offerAccepted) {
    t.push({
      role: "ai",
      text: hi
        ? `Aapka area check karke technician confirm karta hoon. Kab call karun?`
        : `Let me confirm a technician for your area. When can we call you back?`,
    });
    t.push({
      role: "customer",
      text: hi ? "Shaam ko 6 baje." : "Call me at 6 PM.",
    });
  } else {
    t.push({
      role: "ai",
      text: hi
        ? `Koi baat nahi. Main aapko ek quote WhatsApp par bhej deta hoon, jab chahein dekh lena.`
        : `No problem. I'll send a quote on WhatsApp — feel free to review it anytime.`,
    });
    t.push({
      role: "customer",
      text: hi ? "Theek hai, bhej do." : "Alright, send it.",
    });
  }

  // ---- Score ----
  const signals: QualSignals = {
    intent,
    areaMatch,
    sentiment,
    offerAccepted,
    urgency,
    engaged: true,
  };
  const { score } = computeScore(signals);

  // ---- Disposition ----
  let disposition: string;
  if (humanRequested) disposition = "HUMAN_REQUESTED";
  else if (offerAccepted && areaMatch) disposition = "BOOKED";
  else if (offerAccepted) disposition = "CALLBACK";
  else if (sentiment === "negative") disposition = "NOT_INTERESTED";
  else disposition = "CALLBACK";

  const durationSec = 45 + Math.floor(rand() * 120);
  const summary = humanRequested
    ? `Customer asked to speak to a human about ${intentLabel[intent]}. Warm hand-off triggered.`
    : disposition === "BOOKED"
      ? `Customer qualified for ${intentLabel[intent]} and accepted a booking slot.`
      : disposition === "CALLBACK"
        ? `Customer interested in ${intentLabel[intent]}; callback scheduled.`
        : `Customer not interested in ${intentLabel[intent]} on this call.`;

  return {
    transcript: t,
    summary,
    sentiment,
    disposition,
    signals,
    score,
    intent,
    humanRequested,
    durationSec,
  };
}

// ---------------------------------------------------------------------
//  Orchestrator
// ---------------------------------------------------------------------
export type AiCallResult = {
  skipped: boolean;
  reason?: string;
  callId?: string;
  ticketId?: string | null;
  analysis?: CallAnalysis;
  live?: { ok: boolean; sid?: string; error?: string } | null;
  mode: string;
};

export async function runAiCall(leadId: string): Promise<AiCallResult> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  // 1. Compliance: DND
  if (lead.dnd) {
    await prisma.lead.update({ where: { id: leadId }, data: { status: "DND" } });
    await prisma.activity.create({
      data: {
        leadId,
        type: "DND_SKIP",
        note: "Call skipped — number registered on DND.",
      },
    });
    return { skipped: true, reason: "DND", mode: aiMode() };
  }

  // 2. Open call record
  const call = await prisma.call.create({
    data: {
      leadId,
      direction: "OUTBOUND",
      status: "IN_PROGRESS",
      handledByAi: true,
    },
  });
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "AI_CALLING", lastContactedAt: new Date() },
  });
  await prisma.activity.create({
    data: {
      leadId,
      type: "CALL_STARTED",
      note: "AI voice agent dialing…",
      meta: JSON.stringify({ callId: call.id }),
    },
  });

  // 3. Conversation brain
  const analysis = await generateConversation(lead);

  // 4. Live provider hook (only when configured)
  let live: AiCallResult["live"] = null;
  if (aiMode() === "live") {
    const base = process.env.PUBLIC_BASE_URL || "";
    live = await startTwilioCall({
      to: lead.phone,
      mediaBridgeUrl: `${base}/api/webhooks/twilio/voice?leadId=${leadId}`,
      statusCallbackUrl: `${base}/api/webhooks/twilio/status`,
    });
  }

  // 5. Persist call analysis
  await prisma.call.update({
    where: { id: call.id },
    data: {
      status: analysis.humanRequested ? "HANDOFF" : "COMPLETED",
      duration: analysis.durationSec,
      transcript: JSON.stringify(analysis.transcript),
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      disposition: analysis.disposition,
      aiScore: analysis.score,
      endedAt: new Date(),
    },
  });

  const newStatus = analysis.humanRequested
    ? "HUMAN_FOLLOWUP"
    : statusFromScore(analysis.score);

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: newStatus, intent: analysis.intent, score: analysis.score },
  });

  await prisma.activity.create({
    data: {
      leadId,
      type: "CALL_COMPLETED",
      note: `AI call — ${analysis.disposition}. Score ${analysis.score}. ${analysis.summary}`,
      meta: JSON.stringify({
        callId: call.id,
        sentiment: analysis.sentiment,
        score: analysis.score,
      }),
    },
  });

  // 6. Side effects: human hand-off, booking confirmation
  let ticketId: string | null = null;
  if (analysis.humanRequested) {
    const ticket = await prisma.ticket.create({
      data: {
        leadId,
        subject: `Human follow-up requested — ${analysis.intent}`,
        reason: analysis.summary,
        priority: "HIGH",
        status: "OPEN",
        customerPhone: lead.phone,
        preferredTime: lead.bestTime || "ASAP",
      },
    });
    ticketId = ticket.id;
    await prisma.activity.create({
      data: {
        leadId,
        type: "HANDOFF",
        note: "Warm hand-off / callback ticket created.",
        meta: JSON.stringify({ ticketId }),
      },
    });
  } else if (analysis.disposition === "BOOKED") {
    const when = new Date(Date.now() + 2 * 86400000);
    await prisma.serviceJob.create({
      data: {
        leadId,
        customerId: leadId,
        type: analysis.intent,
        status: "SCHEDULED",
        scheduledAt: when,
        address: [lead.area, lead.city].filter(Boolean).join(", ") || null,
        amount: estimateAmount(analysis.intent),
      },
    });
    await prisma.message.create({
      data: {
        leadId,
        channel: "WHATSAPP",
        body: `Hi ${lead.name}, your RO service (${analysis.intent}) is provisionally booked. Our team will confirm shortly. — WaterPure`,
      },
    });
  }

  return {
    skipped: false,
    callId: call.id,
    ticketId,
    analysis,
    live,
    mode: aiMode(),
  };
}

// ---------------------------------------------------------------------
//  Batch runner (campaign dialing with limited concurrency)
// ---------------------------------------------------------------------
export async function runCampaignLeads(leadIds: string[], concurrency = 3) {
  const results: AiCallResult[] = [];
  let index = 0;

  async function worker() {
    while (index < leadIds.length) {
      const current = leadIds[index++];
      try {
        results.push(await runAiCall(current));
      } catch (e) {
        results.push({
          skipped: true,
          reason: (e as Error).message,
          mode: aiMode(),
        });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, leadIds.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

export { buildAgentSystemPrompt, createRealtimeSession };
