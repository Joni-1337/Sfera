import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie } from "@/lib/auth";
import { completeEmailVerification } from "@/lib/verify-email-login";

function loginRedirect(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/login", request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return loginRedirect(request, {
      verify: "missing",
    });
  }

  try {
    const result = await completeEmailVerification(token);

    if ("error" in result) {
      return loginRedirect(request, {
        verify: "failed",
        hint: result.error,
      });
    }

    const cookie = await buildSessionCookie({
      role: "teacher",
      id: result.teacher.id,
      name: result.teacher.fullName,
      email: result.teacher.email,
    });

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error("[api/verify-email]", error);
    return loginRedirect(request, { verify: "server" });
  }
}
