import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/dedupe";
import { setPortalCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();
    const p = normalizePhone(String(phone || ""));
    if (!p || !otp) {
      return NextResponse.json({ error: "Phone and OTP required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { phone: p } });
    if (!lead) {
      return NextResponse.json({ error: "No account found for this number" }, { status: 404 });
    }

    // Dev-mode OTP validator: any 6-digit matches in non-production.
    const dev = process.env.NODE_ENV !== "production";
    const otpOk = dev
      ? String(otp).length === 6 && /^\d{6}$/.test(String(otp))
      : String(otp) === "000000"; // placeholder for real SMS provider in prod

    if (!otpOk) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    await setPortalCookie(lead.id, p);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}