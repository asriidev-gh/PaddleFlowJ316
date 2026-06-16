import path from "node:path";

export const OFFLINE_SNAPSHOT_VERSION = 1;

/** Root folder for offline JSON snapshots (gitignored). */
export function resolveOfflineDataDir() {
  const override = process.env.OFFLINE_GAME_DATA_DIR?.trim();
  if (override) return path.resolve(override);
  return path.resolve(process.cwd(), "data", "offline");
}

export function isOfflineGameFallbackEnabled() {
  const flag = process.env.OFFLINE_GAME_FALLBACK?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "no") return false;
  if (flag === "true" || flag === "1" || flag === "yes") return true;
  // Writable filesystem is required; Vercel serverless cannot persist local JSON.
  return !process.env.VERCEL;
}

export function isOfflineAutoFallbackEnabled() {
  const flag = process.env.OFFLINE_GAME_AUTO_FALLBACK?.trim().toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}
