/** Cookie helpers safe for proxy.ts — no DB or mongoose imports. */

export const AUTH_COOKIE_NAME = "ccf_auth";

export function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}

export function authCookieClearOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export function authCookieSetOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
