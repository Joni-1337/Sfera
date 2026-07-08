import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/verify-email") {
    return NextResponse.next();
  }

  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (token) {
    const url = new URL("/api/verify-email", request.url);
    url.searchParams.set("token", token);
    return NextResponse.redirect(url);
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("verify", "missing");
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/verify-email"],
};
