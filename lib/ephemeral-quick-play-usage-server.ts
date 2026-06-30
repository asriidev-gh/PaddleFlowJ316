import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import type {
  EphemeralQuickPlayUsageInput,
  EphemeralQuickPlayUsageInsights,
} from "@/lib/ephemeral-quick-play-usage-shared";
import { parseDeviceCategory } from "@/lib/parse-device-category";
import { EphemeralQuickPlayUsage } from "@/models/EphemeralQuickPlayUsage";
import { EphemeralQuickPlayVisitor } from "@/models/EphemeralQuickPlayVisitor";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_PER_IP = 40;

type RecordUsageInput = EphemeralQuickPlayUsageInput & {
  ipAddress: string;
  userAgent: string;
  authUserId?: string | null;
};

export async function recordEphemeralQuickPlayUsage(input: RecordUsageInput) {
  await connectToDatabase();

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentFromIp = await EphemeralQuickPlayUsage.countDocuments({
    ipAddress: input.ipAddress,
    createdAt: { $gte: since },
  });
  if (recentFromIp >= RATE_LIMIT_MAX_PER_IP) {
    return { recorded: false as const, reason: "rate_limited" as const };
  }

  const now = new Date();
  const deviceCategory = parseDeviceCategory(input.userAgent);
  const authUserObjectId =
    input.authUserId && Types.ObjectId.isValid(input.authUserId)
      ? new Types.ObjectId(input.authUserId)
      : null;

  await EphemeralQuickPlayUsage.create({
    gameId: input.gameId,
    visitorId: input.visitorId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent.slice(0, 500),
    deviceCategory,
    authUserId: authUserObjectId,
    gameMode: input.gameMode,
    courtCount: input.courtCount,
    playerCount: input.playerCount,
    openPlayType: input.openPlayType,
    matchingType: input.matchingType ?? "",
  });

  const visitorUpdate: Record<string, unknown> = {
    $set: {
      lastSeenAt: now,
      lastIpAddress: input.ipAddress,
      lastUserAgent: input.userAgent.slice(0, 500),
      lastDeviceCategory: deviceCategory,
    },
    $setOnInsert: {
      visitorId: input.visitorId,
      firstSeenAt: now,
    },
    $inc: { sessionCount: 1 },
  };

  if (authUserObjectId) {
    visitorUpdate.$addToSet = { authUserIds: authUserObjectId };
  }

  await EphemeralQuickPlayVisitor.findOneAndUpdate({ visitorId: input.visitorId }, visitorUpdate, {
    upsert: true,
  });

  return { recorded: true as const };
}

export async function getEphemeralQuickPlayUsageInsights(): Promise<EphemeralQuickPlayUsageInsights> {
  await connectToDatabase();

  const now = Date.now();
  const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    sessions,
    uniqueVisitors,
    repeatVisitors,
    sessionsLast7Days,
    sessionsLast30Days,
    byDeviceRows,
    recentSessions,
    topRepeatVisitors,
  ] = await Promise.all([
    EphemeralQuickPlayUsage.countDocuments(),
    EphemeralQuickPlayVisitor.countDocuments(),
    EphemeralQuickPlayVisitor.countDocuments({ sessionCount: { $gte: 2 } }),
    EphemeralQuickPlayUsage.countDocuments({ createdAt: { $gte: last7Days } }),
    EphemeralQuickPlayUsage.countDocuments({ createdAt: { $gte: last30Days } }),
    EphemeralQuickPlayUsage.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$deviceCategory", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    EphemeralQuickPlayUsage.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    EphemeralQuickPlayVisitor.find()
      .sort({ sessionCount: -1, lastSeenAt: -1 })
      .limit(25)
      .lean(),
  ]);

  const visitorIds = recentSessions.map((row) => row.visitorId);
  const visitorCounts = await EphemeralQuickPlayVisitor.find({
    visitorId: { $in: visitorIds },
  })
    .select({ visitorId: 1, sessionCount: 1 })
    .lean();
  const sessionCountByVisitor = new Map(
    visitorCounts.map((row) => [row.visitorId, row.sessionCount as number]),
  );

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      sessions,
      uniqueVisitors,
      repeatVisitors,
      sessionsLast7Days,
      sessionsLast30Days,
    },
    byDevice: byDeviceRows.map((row) => ({
      device: row._id || "unknown",
      count: row.count,
    })),
    recentSessions: recentSessions.map((row) => ({
      id: String(row._id),
      gameId: row.gameId,
      visitorId: row.visitorId,
      visitorSessionCount: sessionCountByVisitor.get(row.visitorId) ?? 1,
      ipAddress: row.ipAddress,
      deviceCategory: row.deviceCategory,
      userAgent: row.userAgent ?? "",
      gameMode: row.gameMode,
      courtCount: row.courtCount,
      playerCount: row.playerCount,
      openPlayType: row.openPlayType,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : "",
      authUserId: row.authUserId ? String(row.authUserId) : null,
    })),
    topRepeatVisitors: topRepeatVisitors.map((row) => ({
      visitorId: row.visitorId,
      sessionCount: row.sessionCount,
      firstSeenAt: row.firstSeenAt ? new Date(row.firstSeenAt).toISOString() : "",
      lastSeenAt: row.lastSeenAt ? new Date(row.lastSeenAt).toISOString() : "",
      lastIpAddress: row.lastIpAddress ?? "",
      lastDeviceCategory: row.lastDeviceCategory ?? "unknown",
    })),
  };
}
