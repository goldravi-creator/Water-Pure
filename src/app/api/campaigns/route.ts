import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, channel, dailyLimit, script } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const campaign = await prisma.campaign.create({
      data: {
        name: String(name),
        channel: channel || "OUTBOUND",
        dailyLimit: Number(dailyLimit) || 300,
        script: script || null,
        status: "ACTIVE",
      },
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}