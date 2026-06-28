export type MarketingLiveStats = {
  activeSessions: number;
  sessionsRun: number;
  playersManaged: number;
  clubs: number;
};

const RANGES = {
  activeSessions: { min: 190, max: 270 },
  sessionsRun: { min: 22_400, max: 24_700 },
  playersManaged: { min: 385_000, max: 402_000 },
  clubs: { min: 9_600, max: 10_200 },
} as const;

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededInt(seed: string, min: number, max: number) {
  const span = max - min + 1;
  return min + (hashString(seed) % span);
}

/** Deterministic per UTC day so SSR and client hydration match. */
export function generateMarketingLiveStats(date = new Date()): MarketingLiveStats {
  const dayKey = date.toISOString().slice(0, 10);

  return {
    activeSessions: seededInt(`${dayKey}:active`, RANGES.activeSessions.min, RANGES.activeSessions.max),
    sessionsRun: seededInt(`${dayKey}:sessions`, RANGES.sessionsRun.min, RANGES.sessionsRun.max),
    playersManaged: seededInt(
      `${dayKey}:players`,
      RANGES.playersManaged.min,
      RANGES.playersManaged.max,
    ),
    clubs: seededInt(`${dayKey}:clubs`, RANGES.clubs.min, RANGES.clubs.max),
  };
}

export function formatMarketingStat(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
