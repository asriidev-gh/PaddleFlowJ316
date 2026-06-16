import {
  isOfflineAutoFallbackEnabled,
  isOfflineGameFallbackEnabled,
} from "@/lib/offline-game/config";
import { exportGameSnapshotFromMongo } from "@/lib/offline-game/export-from-mongo";
import { syncOfflineSnapshotToMongo } from "@/lib/offline-game/sync-to-mongo";
import {
  isGameInOfflineMode,
  markGameOfflineMode,
  offlineSnapshotExists,
  readOfflineSnapshot,
  writeOfflineSnapshot,
} from "@/lib/offline-game/store";
import type { OfflineModeStatus } from "@/lib/offline-game/types";
import { runWithDatabase } from "@/lib/db";

function collectErrorMessages(error: unknown) {
  const messages: string[] = [];
  let current: unknown = error;
  while (current instanceof Error) {
    messages.push(current.message);
    current = current.cause;
  }
  if (typeof current === "string") messages.push(current);
  return messages;
}

export function isMongoUnavailableError(error: unknown) {
  const text = collectErrorMessages(error).join(" ");
  return /MongoDB connection|connection failed|not connected|server selection|topology|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|quota|limit/i.test(
    text,
  );
}

export async function getOfflineModeStatus(gameId: string): Promise<OfflineModeStatus> {
  const enabled = isOfflineGameFallbackEnabled();
  const offline = enabled ? await isGameInOfflineMode(gameId) : false;
  const snapshot = enabled ? await readOfflineSnapshot(gameId) : null;

  return {
    enabled,
    offline,
    savedAt: snapshot?.savedAt,
    offlineSince: snapshot?.offlineSince,
    pendingSync: offline,
    snapshotExists: Boolean(snapshot),
    autoFallback: isOfflineAutoFallbackEnabled(),
  };
}

export async function enterOfflineMode(gameId: string, ownerId: string) {
  if (!isOfflineGameFallbackEnabled()) {
    throw new Error("Offline game fallback is not enabled on this host.");
  }

  let snapshot = null;
  try {
    snapshot = await runWithDatabase(() => exportGameSnapshotFromMongo(gameId, ownerId));
  } catch (error) {
    const existing = await readOfflineSnapshot(gameId);
    if (!existing || existing.ownerId !== ownerId) {
      throw error instanceof Error
        ? error
        : new Error("Could not export game from MongoDB and no local snapshot exists.");
    }
    snapshot = existing;
  }

  const stamped = await writeOfflineSnapshot({
    ...snapshot,
    offlineSince: snapshot.offlineSince ?? new Date().toISOString(),
  });
  await markGameOfflineMode(gameId, ownerId);
  return stamped;
}

export async function syncOfflineModeToMongo(gameId: string, ownerId: string) {
  if (!isOfflineGameFallbackEnabled()) {
    throw new Error("Offline game fallback is not enabled on this host.");
  }
  if (!(await isGameInOfflineMode(gameId))) {
    throw new Error("This game is not in offline mode.");
  }

  return runWithDatabase(() => syncOfflineSnapshotToMongo(gameId, ownerId));
}

export async function refreshOfflineShadowFromMongo(gameId: string, ownerId: string) {
  if (!isOfflineGameFallbackEnabled()) return;
  if (await isGameInOfflineMode(gameId)) return;

  try {
    await runWithDatabase(() => exportGameSnapshotFromMongo(gameId, ownerId));
  } catch {
    // Shadow backups are best-effort.
  }
}

export async function maybeAutoEnterOfflineMode(gameId: string, ownerId: string, error: unknown) {
  if (!isOfflineGameFallbackEnabled() || !isOfflineAutoFallbackEnabled()) return false;
  if (!isMongoUnavailableError(error)) return false;
  if (!(await offlineSnapshotExists(gameId))) return false;

  const snapshot = await readOfflineSnapshot(gameId);
  if (!snapshot || snapshot.ownerId !== ownerId) return false;

  await markGameOfflineMode(gameId, ownerId);
  return true;
}
