import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizePhone, isValidIndianMobile } from "@/lib/dedupe";
import { isDnd } from "@/lib/dnd";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const source = url.searchParams.get("source") || "";
  const intent = url.searchParams.get("intent") || "";
  const assigned = url.searchParams.get("assigned") || "";
  const sort = url.searchParams.get("sort") || "createdAt";
  const dir = url.searchParams.get("dir") === "asc" ? "asc" : "desc";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (source) where.source = source;
  if (intent) where.intent = intent;
  if (assigned) where.assignedToId = assigned;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q.replace(/[^\d]/g, "") } },
      { email: { contains: q } },
      { city: { contains: q } },
      { area: { contains: q } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { [sort]: dir },
      take: limit,
      include: {
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { calls: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({ leads, total });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const phone = normalizePhone(String(body.phone || ""));
    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
    }
    if (!isValidIndianMobile(phone)) {
      return NextResponse.json({ error: "Valid 10-digit mobile required" }, { status: 400 });
    }

    const existing = await prisma.lead.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: "Lead with this number already exists" }, { status: 409 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email: body.email || null,
        city: body.city || null,
        area: body.area || null,
        language: body.language || "hi",
        source: body.source || "COLD_UPLOAD",
        intent: body.intent || null,
        dnd: isDnd(phone),
        bestTime: body.bestTime || null,
        notes: body.notes || null,
        assignedToId: body.assignedToId || null,
        status: "NEW",
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: user.id,
        type: "LEAD_CREATED",
        note: `Lead created manually by ${user.name}`,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}