import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, db: "error", message: (e as Error).message },
      { status: 500 }
    );
  }
}