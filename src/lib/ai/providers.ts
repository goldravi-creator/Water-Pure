// =====================================================================
//  Live provider integrations — Twilio Programmable Voice + OpenAI
//  GPT-4o Realtime.
//
//  These functions are only invoked when AI_MODE="live" AND the
//  corresponding keys are present. They call the public REST APIs via
//  fetch, so no extra SDKs are required. In mock mode the platform runs
//  entirely offline with the simulated voice engine.
//
//  MEDIA BRIDGE:
//  A full duplex voice agent needs a WebSocket media bridge between the
//  Twilio Media Stream and the OpenAI Realtime session. That bridge is a
//  small always-on Node service (see /docs or the deployment guide).
//  This file provides the session/call bootstrap and webhook handling.
// =====================================================================

export type AiMode = "mock" | "live";

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function hasTwilio(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

export function aiMode(): AiMode {
  const requested = (process.env.AI_MODE || "mock").toLowerCase();
  if (requested === "live" && hasOpenAI() && hasTwilio()) return "live";
  return "mock";
}

export function providerStatus() {
  return {
    mode: aiMode(),
    openaiConfigured: hasOpenAI(),
    twilioConfigured: hasTwilio(),
  };
}

/**
 * Place an outbound call through Twilio. The `url` should point at the
 * media-bridge endpoint which streams audio to OpenAI Realtime.
 */
export async function startTwilioCall(params: {
  to: string;
  from?: string;
  mediaBridgeUrl: string;
  statusCallbackUrl?: string;
}): Promise<{ ok: boolean; sid?: string; error?: string }> {
  if (!hasTwilio()) return { ok: false, error: "Twilio not configured" };

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = params.from || process.env.TWILIO_PHONE_NUMBER!;

  const body = new URLSearchParams({
    To: params.to,
    From: from,
    Url: params.mediaBridgeUrl,
    ...(params.statusCallbackUrl
      ? { StatusCallback: params.statusCallbackUrl, StatusCallbackEvent: "completed" }
      : {}),
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );
    const data = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message || "Twilio error" };
    return { ok: true, sid: data.sid };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Create an ephemeral OpenAI Realtime session config (documented shape). */
export async function createRealtimeSession(systemPrompt: string) {
  if (!hasOpenAI()) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview",
        voice: "alloy",
        instructions: systemPrompt,
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: { type: "server_vad" },
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Build the system prompt for the RO-water voice agent. */
export function buildAgentSystemPrompt(lead: {
  name: string;
  language: string;
  city?: string | null;
  area?: string | null;
}, kbContext: string): string {
  const langLine =
    lead.language?.startsWith("en")
      ? "Speak in clear English."
      : "Speak in natural Hinglish (Hindi + English mix) unless the customer prefers otherwise.";

  return `You are "Aarav", the friendly AI phone assistant for WaterPure RO Services, an RO water purifier installation and service company.
${langLine}

CALL GOAL
- Qualify the customer for: new RO installation, AMC/service plan, repair, filter/parts replacement, or water testing.
- Be warm, concise, honest. Disclose that you are an AI assistant near the start.
- Never pressure. Respect a "no".
- If the customer asks to speak to a human, a manager, or says they need detailed help, IMMEDIATELY call the tool transferToHuman.
- If the customer is busy, call scheduleCallback with their preferred time.
- If they want to proceed, call bookService with the service type and a proposed slot.

CUSTOMER CONTEXT
- Name: ${lead.name}
- City/Area: ${lead.city ?? "unknown"} / ${lead.area ?? "unknown"}

KNOWLEDGE BASE (use these facts for pricing, AMC terms, service areas):
${kbContext}

COMPLIANCE
- Do not make false promises. If unsure, offer a human hand-off.
- Keep each turn under ~25 words. Allow barge-in.`;
}
