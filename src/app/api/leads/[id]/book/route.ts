import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { bookServiceFromLead } from "@/lib/automation";

// Book a service job for a lead
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { type, scheduledAt } = await req.json();
    if (!type) return NextResponse.json({ error: "Service type required" }, { status: 400 });

    const job = await bookServiceFromLead(
      params.id,
      String(type),
      scheduledAt ? new Date(scheduledAt) : undefined
    );
    return NextResponse.json({ job }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}