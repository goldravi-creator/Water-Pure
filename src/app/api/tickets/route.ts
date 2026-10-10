import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const where = status ? { status } : {};

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { leadId, subject, reason, priority, customerPhone, preferredTime } = body;
    if (!customerPhone && !leadId) {
      return NextResponse.json({ error: "Customer phone or lead required" }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        leadId: leadId || null,
        subject: subject || "Human hand-off / callback",
        reason: reason || null,
        priority: priority || "HIGH",
        status: "OPEN",
        customerPhone: customerPhone || "",
        preferredTime: preferredTime || "ASAP",
      },
    });

    if (leadId) {
      await prisma.activity.create({
        data: {
          leadId,
          userId: user.id,
          type: "HANDOFF",
          note: `Human hand-off ticket created: ${subject}`,
          meta: JSON.stringify({ ticketId: ticket.id }),
        },
      });
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}