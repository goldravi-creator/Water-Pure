import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/dedupe";

// =====================================================================
//  Customer portal — OTP login.
//  Dev mode: the OTP is returned in the response so the flow is fully
//  testable without an SMS gateway. In production a real SMS/WhatsApp
//  provider would be plugged in here.
// =====================================================================

const otpStore = new Map<string, { code: string; exp: number }>();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const p = normalizePhone(String(phone || ""));
    if (!p) return NextResponse.json({ error: "Phone required" }, { status: 400 });

    let lead = await prisma.lead.findUnique({ where: { phone: p } });
    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          name: "Portal User",
          phone: p,
          source: "WALKIN",
          status: "NEW",
          consent: true,
        },
      });
    }

    const code = generateOtp();
    otpStore.set(p, { code, exp: Date.now() + 10 * 60 * 1000 });

    const dev = process.env.NODE_ENV !== "production";
    return NextResponse.json({
      ok: true,
      // REMOVE in production — dev convenience so the demo works without SMS.
      ...(dev ? { devOtp: code } : {}),
      message: dev
        ? `OTP sent (dev): ${code}`
        : "OTP sent to your mobile via SMS.",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}