import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PORTAL_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  cookies().delete(PORTAL_COOKIE);
  return NextResponse.redirect(new URL("/", req.url));
}