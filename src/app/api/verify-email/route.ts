import { NextRequest, NextResponse } from "next/server";
import { completeEmailVerification } from "@/lib/verify-email-login";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.redirect(
      new URL("/verify-email?error=missing", request.url)
    );
  }

  try {
    const result = await completeEmailVerification(token);

    if ("error" in result) {
      const url = new URL("/verify-email", request.url);
      url.searchParams.set("error", result.error);
      return NextResponse.redirect(url);
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("[api/verify-email]", error);
    return NextResponse.redirect(
      new URL("/verify-email?error=server", request.url)
    );
  }
}
