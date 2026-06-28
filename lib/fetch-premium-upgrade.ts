import type { PremiumUpgradeRequestSummary } from "@/lib/premium-upgrade-requests";

export const premiumUpgradeRequestQueryKey = ["premium-upgrade-request"] as const;

export async function fetchPremiumUpgradeRequest() {
  const response = await fetch("/api/premium/upgrade-request");  const data = (await response.json()) as {
    request: PremiumUpgradeRequestSummary | null;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(data.message ?? "Failed to load your submission.");
  }
  return data.request;
}

export async function submitPremiumUpgradeRequest(input: {
  paymentMethod: string;
  payerNote: string;
  proofFile: File;
}) {
  const formData = new FormData();
  formData.set("paymentMethod", input.paymentMethod);
  formData.set("payerNote", input.payerNote);
  formData.set("proof", input.proofFile);

  const response = await fetch("/api/premium/upgrade-request", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as {
    request?: PremiumUpgradeRequestSummary;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(data.message ?? "Failed to submit payment proof.");
  }
  return data.request!;
}
