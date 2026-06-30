import { z } from "zod";

import { EPHEMERAL_QUICK_GAME_ID_PREFIX } from "@/lib/local-game-id";

const ephemeralGameIdPattern = new RegExp(
  `^${EPHEMERAL_QUICK_GAME_ID_PREFIX}[a-z0-9]{8,32}$`,
  "i",
);

export const ephemeralQuickPlayUsageSchema = z.object({
  gameId: z.string().trim().regex(ephemeralGameIdPattern, "Invalid ephemeral quick play id."),
  visitorId: z.string().trim().min(8).max(64),
  gameMode: z.enum(["doubles", "singles"]),
  courtCount: z.number().int().min(1).max(20),
  playerCount: z.number().int().min(0).max(200),
  openPlayType: z.string().trim().min(1).max(80),
  matchingType: z.enum(["auto-balanced", "winner-loser-groups", "mixed-doubles"]).optional(),
});

export type EphemeralQuickPlayUsageInput = z.infer<typeof ephemeralQuickPlayUsageSchema>;

export type EphemeralQuickPlayUsageInsights = {
  generatedAt: string;
  totals: {
    sessions: number;
    uniqueVisitors: number;
    repeatVisitors: number;
    sessionsLast7Days: number;
    sessionsLast30Days: number;
  };
  byDevice: Array<{ device: string; count: number }>;
  recentSessions: Array<{
    id: string;
    gameId: string;
    visitorId: string;
    visitorSessionCount: number;
    ipAddress: string;
    deviceCategory: string;
    userAgent: string;
    gameMode: string;
    courtCount: number;
    playerCount: number;
    openPlayType: string;
    createdAt: string;
    authUserId: string | null;
  }>;
  topRepeatVisitors: Array<{
    visitorId: string;
    sessionCount: number;
    firstSeenAt: string;
    lastSeenAt: string;
    lastIpAddress: string;
    lastDeviceCategory: string;
  }>;
};
