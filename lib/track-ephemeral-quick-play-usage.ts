import type { EphemeralQuickPlayUsageInput } from "@/lib/ephemeral-quick-play-usage-shared";
import { getOrCreateQuickPlayVisitorId } from "@/lib/quick-play-visitor-id";

export function trackEphemeralQuickPlayUsage(
  input: Omit<EphemeralQuickPlayUsageInput, "visitorId">,
) {
  const visitorId = getOrCreateQuickPlayVisitorId();
  if (!visitorId) return;

  void fetch("/api/play/usage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      visitorId,
    }),
    keepalive: true,
  }).catch(() => {
    // Best-effort analytics; never block the session flow.
  });
}
