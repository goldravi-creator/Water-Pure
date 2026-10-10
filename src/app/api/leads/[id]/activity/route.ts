import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { note, type } = await req.json();
  if (!note || !String(note).trim()) {
    return NextResponse.json({ error: "Note required" }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: {
      leadId: params.id,
      userId: user.id,
      type: type || "NOTE_ADDED",
      note: String(note),
    },
  });

  return NextResponse.json({ activity }, { status: 201 });
}