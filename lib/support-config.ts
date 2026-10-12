import { getSuperAdminEmails } from "@/lib/superadmin";

export {
  FEEDBACK_RATE_LIMIT_MS,
  MAX_FEEDBACK_MESSAGE_LENGTH,
} from "@/lib/support-config-shared";

/**
 * Inbox for Help Center submissions (Resend `to`).
 * Prefer SUPPORT_EMAIL, then NEXT_PUBLIC_SUPPORT_EMAIL, then first SUPERADMIN_EMAILS entry.
 */
export function getSupportEmail(): string {
  const configured =
    process.env.SUPPORT_EMAIL?.trim() || process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "";
  if (configured) return configured;
  return getSuperAdminEmails()[0] ?? "";
}

/** Client-safe support address for mailto links (empty hides the email fallback). */
export function getPublicSupportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "";
}

export function isSupportEmailConfigured(): boolean {
  return Boolean(getSupportEmail());
}
