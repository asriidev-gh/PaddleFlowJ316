const VISITOR_ID_STORAGE_KEY = "ccf-ephemeral-quick-play-visitor-id";

function createVisitorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `v_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `v_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** Anonymous browser id for repeat quick-play usage analytics (no PII). */
export function getOrCreateQuickPlayVisitorId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY)?.trim();
    if (existing && existing.length >= 8) return existing;
    const next = createVisitorId();
    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, next);
    return next;
  } catch {
    return createVisitorId();
  }
}
