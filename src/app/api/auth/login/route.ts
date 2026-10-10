import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import type { Role } from "@/lib/enums";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });
    if (!user || !user.active) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(String(password), user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await setSessionCookie({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    });

    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
