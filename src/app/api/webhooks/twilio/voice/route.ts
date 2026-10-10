import { prisma } from "@/lib/db";

// =====================================================================
//  Twilio inbound/outbound voice webhook.
//  Returns TwiML that connects the call to the AI media bridge
//  (which streams audio to OpenAI GPT-4o Realtime).
//  In mock mode this just confirms the webhook is reachable.
// =====================================================================

const MEDIA_BRIDGE_WS =
  process.env.MEDIA_BRIDGE_WS || "wss://media-bridge.example.com/stream";

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  try {
    const url = new URL(req.url);
    const leadId = url.searchParams.get("leadId") || "";
    const from = url.searchParams.get("From") || "";

    await prisma.webhookEvent.create({
      data: {
        source: "twilio-voice",
        payload: JSON.stringify({ leadId, from }).slice(0, 4000),
      },
    });

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy" language="en-IN">Thank you for calling WaterPure. Connecting you to our AI assistant for RO service.</Say>
  <Connect>
    <Stream url="${MEDIA_BRIDGE_WS}?leadId=${encodeURIComponent(leadId)}"/>
  </Connect>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (e) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${(e as Error).message}</Say></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}