import { prisma } from "./db";
import { runAiCall, type AiCallResult } from "./ai/agent";

// =====================================================================
//  Automation workflows
//  (section 10 of the blueprint — trigger → condition → action)
// =====================================================================

export type WorkflowResult = {
  workflow: string;
  leadId: string;
  actions: string[];
  call?: AiCallResult;
};

/**
 * New-lead nurture workflow.
 * Triggered whenever a lead is created (upload / website / ads / WhatsApp).
 */
export async function processNewLead(leadId: string): Promise<WorkflowResult> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  const actions: string[] = [];

  await prisma.activity.create({
    data: {
      leadId,
      type: "LEAD_CREATED",
      note: `Lead created from ${lead.source}.`,
    },
  });
  actions.push("logged lead creation");

  // Compliance gate
  if (lead.dnd) {
    await prisma.lead.update({ where: { id: leadId }, data: { status: "DND" } });
    actions.push("blocked: DND");
    return { workflow: "NEW_LEAD_NURTURE", leadId, actions };
  }

  // AI cold-call
  let call: AiCallResult | undefined;
  try {
    call = await runAiCall(leadId);
    actions.push(`AI call: ${call.skipped ? call.reason : call.analysis?.disposition}`);
  } catch (e) {
    actions.push(`AI call failed: ${(e as Error).message}`);
  }

  // Auto follow-up if no definitive outcome
  if (call && !call.skipped) {
    const d = call.analysis?.disposition;
    if (d === "NOT_INTERESTED") {
      await prisma.lead.update({ where: { id: leadId }, data: { status: "NURTURE" } });
      actions.push("moved to nurture");
    } else if (d === "CALLBACK") {
      await sendMessage(
        leadId,
        "WHATSAPP",
        `Hi ${lead.name}, thanks for your time! Here's the RO service info you requested. Reply here anytime. — WaterPure`
      );
      actions.push("sent WhatsApp follow-up");
    }
  }

  return { workflow: "NEW_LEAD_NURTURE", leadId, actions, call };
}

export async function sendMessage(leadId: string, channel: string, body: string) {
  // In live mode this would call Twilio WhatsApp / SMS APIs.
  return prisma.message.create({
    data: { leadId, channel, direction: "OUTBOUND", body, status: "SENT" },
  });
}

/** Post-service follow-up: request review + upsell AMC. */
export async function postServiceFollowUp(leadId: string) {
  const actions: string[] = [];
  await sendMessage(
    leadId,
    "WHATSAPP",
    "Thank you for choosing WaterPure! How was your service today? Please rate us ⭐⭐⭐⭐⭐"
  );
  actions.push("sent review request");
  await prisma.ticket.create({
    data: {
      leadId,
      subject: "Post-service follow-up",
      reason: "Automated post-service review & AMC upsell",
      priority: "LOW",
      status: "OPEN",
      customerPhone: "",
    },
  });
  actions.push("created follow-up ticket");
  return { workflow: "POST_SERVICE_FOLLOWUP", leadId, actions };
}

/** AMC / filter renewal reminder workflow. */
export async function amcRenewalReminder(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  await sendMessage(
    leadId,
    "WHATSAPP",
    `Hi ${lead.name}, your RO AMC is due for renewal. Renew now to keep uninterrupted pure water. — WaterPure`
  );
  return { workflow: "AMC_RENEWAL", leadId, actions: ["sent renewal reminder"] };
}

/** Book a service job from a lead (manual or AI-driven). */
export async function bookServiceFromLead(
  leadId: string,
  type: string,
  scheduledAt?: Date
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  const job = await prisma.serviceJob.create({
    data: {
      leadId,
      customerId: leadId,
      type,
      status: "SCHEDULED",
      scheduledAt: scheduledAt ?? new Date(Date.now() + 2 * 86400000),
      address: [lead.area, lead.city].filter(Boolean).join(", ") || null,
    },
  });
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "CONVERTED", isCustomer: true },
  });
  await prisma.activity.create({
    data: {
      leadId,
      type: "SERVICE_BOOKED",
      note: `Service booked: ${type}`,
      meta: JSON.stringify({ jobId: job.id }),
    },
  });
  await sendMessage(
    leadId,
    "WHATSAPP",
    `Hi ${lead.name}, your ${type} service is booked. Our technician will reach you at the scheduled time. — WaterPure`
  );
  return job;
}
