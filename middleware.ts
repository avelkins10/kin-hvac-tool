import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const bypassAuth = process.env.BYPASS_AUTH === "true";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes - allow access without auth check (but /api/auth still goes through proxy for cookie forwarding)
  if (
    path.startsWith("/api/debug") ||
    (path.startsWith("/proposals/") && path.endsWith("/view")) ||
    path === "/unauthorized" ||
    path === "/auth/signin" ||
    path === "/auth/signed-in" ||
    path === "/auth/callback" ||
    path === "/auth/forgot-password" ||
    path === "/auth/set-password" ||
    path.startsWith("/_next") ||
    path.startsWith("/api/webhooks")
  ) {
    return NextResponse.next();
  }

  // Bypass: skip auth redirect so app is usable without login (dev/demo only)
  if (bypassAuth) {
    return NextResponse.next();
  }

  // Refresh Supabase session (tokens/cookies).
  const { response: supabaseResponse } = await updateSession(request);

  // Explicitly forward Cookie header to the request passed downstream (Vercel
  // serverless may not receive cookies from the edge proxy otherwise).
  const requestHeaders = new Headers(request.headers);
  const cookieHeader = request.cookies
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  if (cookieHeader) requestHeaders.set("Cookie", cookieHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  // Preserve any Set-Cookie from Supabase session refresh
  supabaseResponse.cookies.getAll().forEach((c) => {
    response.cookies.set(c.name, c.value, c);
  });
  return response;
}

export const config = {
  matcher: [
    "/",
    "/api/auth/:path*",
    "/api/finance/:path*",
    "/auth/callback",
    "/auth/forgot-password",
    "/auth/set-password",
    "/auth/signed-in",
    "/admin/:path*",
    "/proposals/:path*",
    "/dashboard/:path*",
    "/clients/:path*",
    "/builder/:path*",
    "/users/:path*",
  ],
};
