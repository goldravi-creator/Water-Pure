import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Twilio call-status callback
export async function POST(req: Request) {
  try {
    const text = await req.text();
    await prisma.webhookEvent.create({
      data: {
        source: "twilio-status",
        payload: text.slice(0, 4000),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}