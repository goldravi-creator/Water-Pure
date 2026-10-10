import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-please-change"
);

async function validToken(token?: string) {
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Customer portal
  if (pathname.startsWith("/portal")) {
    if (pathname.startsWith("/portal/login")) return NextResponse.next();
    const ok = await validToken(req.cookies.get("ro_portal")?.value);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/portal/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Staff CRM
  if (pathname.startsWith("/crm")) {
    const ok = await validToken(req.cookies.get("ro_session")?.value);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/crm/:path*", "/portal/:path*"],
};
