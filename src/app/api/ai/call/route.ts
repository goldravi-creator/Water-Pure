import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runAiCall } from "@/lib/ai/agent";

// =====================================================================
//  Trigger a single AI telecall on a lead
// =====================================================================
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ error: "leadId required" }, { status: 400 });
    }
    const result = await runAiCall(leadId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}