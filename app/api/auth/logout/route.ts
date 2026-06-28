import { NextResponse } from "next/server";

import { authCookieClearOptions, getAuthCookieName } from "@/lib/auth";

function logoutResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAuthCookieName(), "", authCookieClearOptions());
  return response;
}

export async function POST() {
  return logoutResponse();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectParam = url.searchParams.get("redirect") ?? "/";
  const destination =
    redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/";

  const response = NextResponse.redirect(new URL(destination, url.origin));
  response.cookies.set(getAuthCookieName(), "", authCookieClearOptions());
  return response;
}
