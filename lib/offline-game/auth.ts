import { authorizeAuthPayload, readAuthTokenPayload, type AuthPayload } from "@/lib/auth";
import { runWithDatabase } from "@/lib/db";
import { isOfflineGameFallbackEnabled } from "@/lib/offline-game/config";
import { isGameInOfflineMode, readOfflineSnapshot } from "@/lib/offline-game/store";

export async function getOperatorAuthUser(gameId: string): Promise<AuthPayload | null> {
  const payload = await readAuthTokenPayload();
  if (!payload) return null;

  if (!isOfflineGameFallbackEnabled()) {
    return runWithDatabase(() => authorizeAuthPayload(payload));
  }

  const snapshot = await readOfflineSnapshot(gameId);
  const snapshotOwnerMatch = snapshot?.ownerId === payload.userId;

  if (await isGameInOfflineMode(gameId)) {
    if (!snapshotOwnerMatch) return null;
    return payload;
  }

  try {
    const authorized = await runWithDatabase(() => authorizeAuthPayload(payload));
    return authorized;
  } catch {
    if (snapshotOwnerMatch) return payload;
    return null;
  }
}
