import type { OperatorFullPayload } from "@/lib/operator-payload";

const PENDING_TRANSFER_KEY = "ccfpickleball:pending-ephemeral-quick-game-transfer";

export type PendingEphemeralQuickGameTransfer = {
  sourceGameId: string;
  payload: OperatorFullPayload;
  endAfterSave: boolean;
};

export function stashPendingEphemeralQuickGameTransfer(
  transfer: PendingEphemeralQuickGameTransfer,
) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(PENDING_TRANSFER_KEY, JSON.stringify(transfer));
}

export function readPendingEphemeralQuickGameTransfer(): PendingEphemeralQuickGameTransfer | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_TRANSFER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingEphemeralQuickGameTransfer;
  } catch {
    return null;
  }
}

export function clearPendingEphemeralQuickGameTransfer() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PENDING_TRANSFER_KEY);
}
