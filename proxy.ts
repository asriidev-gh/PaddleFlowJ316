import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authCookieClearOptions, getAuthCookieName } from "@/lib/auth-cookie";
import { tryVerifyAuthToken } from "@/lib/auth-token";
import { isQuickGame } from "@/lib/local-game-id";

function leaderboardGameId(pathname: string) {
  return pathname.match(/^\/leaderboard\/([^/]+)/)?.[1] ?? null;
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set(getAuthCookieName(), "", authCookieClearOptions());
  return response;
}

function withStaleAuthCookieCleared(
  response: NextResponse,
  authCookie: string | undefined,
  hasValidAuth: boolean,
) {
  if (authCookie && !hasValidAuth) {
    clearAuthCookie(response);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const authCookie = request.cookies.get(getAuthCookieName())?.value;
  const hasValidAuth = tryVerifyAuthToken(authCookie);
  const isSpectatorGameRoute = /^\/games\/[^/]+\/spectate(?:\/.*)?$/.test(pathname);
  const isSpectatorLeaderboard =
    pathname.startsWith("/leaderboard/") && searchParams.get("from") === "spectator";
  const isQuickGameLeaderboard = isQuickGame(leaderboardGameId(pathname));
  const isProtectedRoute =
    (pathname.startsWith("/games") ||
      pathname.startsWith("/leaderboard") ||
      pathname.startsWith("/insights") ||
      pathname.startsWith("/error-logs") ||
      pathname.startsWith("/feature-controls") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/users") ||
      pathname.startsWith("/my-games") ||
      pathname.startsWith("/my-club") ||
      pathname.startsWith("/marketplace")) &&
    !isSpectatorGameRoute &&
    !isSpectatorLeaderboard &&
    !isQuickGameLeaderboard;

  if (isProtectedRoute && !hasValidAuth) {
    return withStaleAuthCookieCleared(
      NextResponse.redirect(new URL("/login", request.url)),
      authCookie,
      hasValidAuth,
    );
  }

  return withStaleAuthCookieCleared(NextResponse.next(), authCookie, hasValidAuth);
}

export const config = {
  matcher: [
    "/",
    "/games/:path*",
    "/leaderboard/:path*",
    "/insights/:path*",
    "/error-logs",
    "/feature-controls",
    "/settings/:path*",
    "/users",
    "/my-games",
    "/my-games/:path*",
    "/my-club",
    "/marketplace",
    "/login",
    "/signup",
    "/signin",
    "/quick-game",
    "/play",
    "/play/:path*",
  ],
};
