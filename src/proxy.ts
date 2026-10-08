import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/login"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|svg|css|js|woff2?)$/)
  )
    return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    const res = NextResponse.next();
    return res;
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sesi tidak valid. Silakan masuk lagi." } },
        { status: 401 },
      );
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const payload = await verifySession(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sesi tidak valid. Silakan masuk lagi." } },
        { status: 401 },
      );
      res.headers.set("Cache-Control", "no-store");
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    res.headers.set("Cache-Control", "no-store");
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
