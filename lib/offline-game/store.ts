import fs from "node:fs/promises";
import path from "node:path";

import {
  isOfflineGameFallbackEnabled,
  OFFLINE_SNAPSHOT_VERSION,
  resolveOfflineDataDir,
} from "@/lib/offline-game/config";
import type { OfflineGameSnapshot, OfflineRegistry } from "@/lib/offline-game/types";

const REGISTRY_FILE = "registry.json";

function snapshotFileName(gameId: string) {
  return `${gameId}.json`;
}

function snapshotPath(gameId: string) {
  return path.join(resolveOfflineDataDir(), snapshotFileName(gameId));
}

function registryPath() {
  return path.join(resolveOfflineDataDir(), REGISTRY_FILE);
}

async function ensureDataDir() {
  if (!isOfflineGameFallbackEnabled()) {
    throw new Error("Offline game fallback is not enabled on this host.");
  }
  await fs.mkdir(resolveOfflineDataDir(), { recursive: true });
}

export async function offlineSnapshotExists(gameId: string) {
  if (!isOfflineGameFallbackEnabled()) return false;
  try {
    await fs.access(snapshotPath(gameId));
    return true;
  } catch {
    return false;
  }
}

export async function readOfflineSnapshot(gameId: string): Promise<OfflineGameSnapshot | null> {
  if (!isOfflineGameFallbackEnabled()) return null;
  try {
    const raw = await fs.readFile(snapshotPath(gameId), "utf8");
    const parsed = JSON.parse(raw) as OfflineGameSnapshot;
    if (!parsed?.gameId || parsed.gameId !== gameId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeOfflineSnapshot(snapshot: OfflineGameSnapshot) {
  await ensureDataDir();
  const target = snapshotPath(snapshot.gameId);
  const temp = `${target}.tmp`;
  const payload = {
    ...snapshot,
    version: OFFLINE_SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
  };
  await fs.writeFile(temp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.rename(temp, target);
  return payload;
}

export async function withOfflineSnapshot<T>(
  gameId: string,
  mutator: (snapshot: OfflineGameSnapshot) => T | Promise<T>,
): Promise<T> {
  const snapshot = await readOfflineSnapshot(gameId);
  if (!snapshot) {
    throw new Error("Offline snapshot not found for this game.");
  }
  const result = await mutator(snapshot);
  await writeOfflineSnapshot(snapshot);
  await touchRegistryGame(gameId, snapshot.ownerId);
  return result;
}

async function readRegistry(): Promise<OfflineRegistry> {
  if (!isOfflineGameFallbackEnabled()) return { games: {} };
  try {
    const raw = await fs.readFile(registryPath(), "utf8");
    const parsed = JSON.parse(raw) as OfflineRegistry;
    return parsed?.games ? parsed : { games: {} };
  } catch {
    return { games: {} };
  }
}

async function writeRegistry(registry: OfflineRegistry) {
  await ensureDataDir();
  const target = registryPath();
  const temp = `${target}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
  await fs.rename(temp, target);
}

export async function isGameInOfflineMode(gameId: string) {
  const registry = await readRegistry();
  return Boolean(registry.games[gameId]);
}

export async function markGameOfflineMode(gameId: string, ownerId: string) {
  const registry = await readRegistry();
  const now = new Date().toISOString();
  registry.games[gameId] = {
    ownerId,
    enteredAt: registry.games[gameId]?.enteredAt ?? now,
    lastSavedAt: now,
  };
  await writeRegistry(registry);
}

export async function clearGameOfflineMode(gameId: string) {
  const registry = await readRegistry();
  if (!registry.games[gameId]) return;
  delete registry.games[gameId];
  await writeRegistry(registry);
}

async function touchRegistryGame(gameId: string, ownerId: string) {
  const registry = await readRegistry();
  const existing = registry.games[gameId];
  if (!existing) return;
  registry.games[gameId] = {
    ownerId,
    enteredAt: existing.enteredAt,
    lastSavedAt: new Date().toISOString(),
  };
  await writeRegistry(registry);
}

export async function listOfflineGames() {
  const registry = await readRegistry();
  return registry.games;
}

export async function removeOfflineSnapshot(gameId: string) {
  try {
    await fs.unlink(snapshotPath(gameId));
  } catch {
    // ignore missing file
  }
}
