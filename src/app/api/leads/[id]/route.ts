import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      calls: {
        orderBy: { startedAt: "desc" },
        include: { agent: { select: { id: true, name: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
      tickets: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" } },
      serviceJobs: { orderBy: { createdAt: "desc" } },
      campaign: true,
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = [
    "status",
    "intent",
    "score",
    "assignedToId",
    "tags",
    "notes",
    "bestTime",
    "language",
    "city",
    "area",
    "email",
    "isCustomer",
  ];

  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body && body[k] !== undefined) data[k] = body[k];

  const updated = await prisma.lead.update({
    where: { id: params.id },
    data,
  });

  const changes: string[] = [];
  if (body.status && body.status !== lead.status) {
    changes.push(`status ${lead.status} → ${body.status}`);
  }
  if (body.assignedToId && body.assignedToId !== lead.assignedToId) {
    changes.push("re-assigned");
  }
  if (changes.length || (body.note || "").trim()) {
    await prisma.activity.create({
      data: {
        leadId: params.id,
        userId: user.id,
        type: body.type || "LEAD_UPDATED",
        note: body.note || changes.join(", ") || "Lead updated",
      },
    });
  }

  return NextResponse.json({ lead: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}