import { NextResponse } from "next/server";
import { runSeed } from "@/lib/seed";

// Seeding writes a lot of rows; give the serverless function room to finish.
export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
//  One-time demo seeding endpoint.
//
//  Enable it by setting a SEED_SECRET environment variable on the deployment,
//  then call it once:
//
//     GET  /api/admin/seed?secret=YOUR_SECRET
//     GET  /api/admin/seed?secret=YOUR_SECRET&aiCalls=12   (lighter/faster)
//
//  It wipes and re-creates the demo data. If SEED_SECRET is not set the route
//  is disabled (returns 403) so it can never be triggered accidentally.
// ---------------------------------------------------------------------------
async function handle(req: Request) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Seeding is disabled (SEED_SECRET not set)." },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const provided = url.searchParams.get("secret") ?? req.headers.get("x-seed-secret");
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const aiCallsParam = url.searchParams.get("aiCalls");
  const aiCalls = aiCallsParam ? Number(aiCallsParam) : 36;

  try {
    const stats = await runSeed({ aiCalls: Number.isFinite(aiCalls) ? aiCalls : 36 });
    return NextResponse.json({ ok: true, seeded: stats });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
