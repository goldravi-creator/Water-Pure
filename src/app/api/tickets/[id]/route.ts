import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId;
  if (body.status === "RESOLVED" || body.status === "CLOSED") {
    data.resolvedAt = new Date();
  }

  const ticket = await prisma.ticket.update({
    where: { id: params.id },
    data,
    include: { lead: { select: { id: true, name: true, phone: true } } },
  });

  return NextResponse.json({ ticket });
}