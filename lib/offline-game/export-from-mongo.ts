import { Types } from "mongoose";

import { resolveClubBranding } from "@/lib/club-branding";
import { loadQueueCourtsAndCheckedOut } from "@/lib/load-spectate-game";
import { OFFLINE_SNAPSHOT_VERSION } from "@/lib/offline-game/config";
import { writeOfflineSnapshot } from "@/lib/offline-game/store";
import type {
  OfflineClubBranding,
  OfflineCourt,
  OfflineGameRecord,
  OfflineGameSnapshot,
  OfflineLeaderboardStat,
  OfflineMatch,
  OfflinePlayerRecord,
  OfflineQueueEntry,
} from "@/lib/offline-game/types";
import { LeaderboardStats } from "@/models/LeaderboardStats";
import { MatchHistory } from "@/models/MatchHistory";
import { PickleGame } from "@/models/PickleGame";
import { Player } from "@/models/Player";
import { QueueEntry } from "@/models/QueueEntry";
import { User } from "@/models/User";
import "@/models/Court";

function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

function toId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: unknown })._id;
    if (id != null) return String(id);
  }
  return String(value);
}

function serializePlayer(player: {
  _id?: unknown;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  personalQrCode?: string;
}): OfflinePlayerRecord {
  return {
    _id: toId(player._id),
    firstName: player.firstName ?? "",
    lastName: player.lastName ?? "",
    photoUrl: player.photoUrl ?? "",
    personalQrCode: player.personalQrCode,
  };
}

export async function exportGameSnapshotFromMongo(
  gameId: string,
  ownerId: string,
): Promise<OfflineGameSnapshot> {
  const game = await PickleGame.findOne({ gameId, ownerId });
  if (!game) {
    throw new Error("Game not found.");
  }

  const [owner, queueState, matches, leaderboardStats, allEntries] = await Promise.all([
    User.findById(ownerId).select("name clubName clubLogoUrl").lean(),
    loadQueueCourtsAndCheckedOut(gameId),
    MatchHistory.find({ gameId }).sort({ endedAt: -1 }).lean(),
    LeaderboardStats.find({ gameId }).lean(),
    QueueEntry.find({ gameId }).lean(),
  ]);

  const playerIds = new Set<string>();
  for (const entry of allEntries) {
    playerIds.add(toId(entry.playerId));
  }
  for (const match of matches) {
    for (const id of match.teamAPlayerIds ?? []) playerIds.add(toId(id));
    for (const id of match.teamBPlayerIds ?? []) playerIds.add(toId(id));
  }
  for (const stat of leaderboardStats) {
    playerIds.add(toId(stat.playerId));
  }

  const players = await Player.find({ _id: { $in: [...playerIds] } })
    .select("firstName lastName photoUrl personalQrCode")
    .lean();

  const playersMap: Record<string, OfflinePlayerRecord> = {};
  for (const player of players) {
    const record = serializePlayer(player);
    playersMap[record._id] = record;
  }

  const clubBranding: OfflineClubBranding | null = owner
    ? {
        ...resolveClubBranding(owner),
        ownerName: typeof owner.name === "string" ? owner.name : undefined,
      }
    : null;

  const gameObject = game.toObject();
  const gameRecord: OfflineGameRecord = {
    _id: toId(gameObject._id),
    title: gameObject.title,
    gameId: gameObject.gameId,
    ownerId: toId(gameObject.ownerId),
    openPlayType: gameObject.openPlayType,
    openPlayDate: toIso(gameObject.openPlayDate) ?? null,
    openPlayTimeRange: gameObject.openPlayTimeRange ?? null,
    courtCount: gameObject.courtCount,
    expectedPlayers: gameObject.expectedPlayers,
    strictPlayerCount: gameObject.strictPlayerCount === true,
    allowQrRegistration: gameObject.allowQrRegistration !== false,
    registrationMode: gameObject.registrationMode,
    registerUrl: gameObject.registerUrl ?? undefined,
    publicQrCodeDataUrl: gameObject.publicQrCodeDataUrl ?? undefined,
    status: gameObject.status,
  };

  const courts: OfflineCourt[] = queueState.courts.map((court) => {
    const obj = court.toObject ? court.toObject() : court;
    return {
      _id: toId(obj._id),
      gameId: obj.gameId,
      courtNumber: obj.courtNumber,
      status: obj.status,
      teamA: {
        playerIds: (obj.teamA?.playerIds ?? []).map(toId),
        queueEntryIds: (obj.teamA?.queueEntryIds ?? []).map(toId),
      },
      teamB: {
        playerIds: (obj.teamB?.playerIds ?? []).map(toId),
        queueEntryIds: (obj.teamB?.queueEntryIds ?? []).map(toId),
      },
      startedAt: toIso(obj.startedAt) ?? null,
      isRematch: obj.isRematch === true,
      createdAt: toIso(obj.createdAt),
      updatedAt: toIso(obj.updatedAt),
    };
  });

  const queueEntries: OfflineQueueEntry[] = allEntries.map((entry) => {
    const obj =
      typeof entry === "object" &&
      entry !== null &&
      "toObject" in entry &&
      typeof entry.toObject === "function"
        ? entry.toObject()
        : entry;
    return {
      _id: toId(obj._id),
      gameId: obj.gameId,
      playerId: toId(obj.playerId),
      status: obj.status,
      queueType: obj.queueType ?? "normal",
      pairGroupId: obj.pairGroupId ?? null,
      deckPlacement: obj.deckPlacement ?? null,
      openCourtGroupId: obj.openCourtGroupId ?? null,
      openCourtTeam: obj.openCourtTeam ?? null,
      registeredAt: toIso(obj.registeredAt) ?? new Date().toISOString(),
      winStreak: obj.winStreak ?? 0,
      lastMatchResult: obj.lastMatchResult ?? "none",
      createdAt: toIso(obj.createdAt),
      updatedAt: toIso(obj.updatedAt),
    };
  });

  const serializedMatches: OfflineMatch[] = matches.map((match) => ({
    _id: toId(match._id),
    gameId: match.gameId,
    courtNumber: match.courtNumber,
    teamAPlayerIds: (match.teamAPlayerIds ?? []).map(toId),
    teamBPlayerIds: (match.teamBPlayerIds ?? []).map(toId),
    winnerTeam: match.winnerTeam,
    loserTeam: match.loserTeam,
    teamAScore: match.teamAScore ?? null,
    teamBScore: match.teamBScore ?? null,
    startedAt: toIso(match.startedAt) ?? null,
    endedAt: toIso(match.endedAt) ?? new Date().toISOString(),
    durationSeconds: match.durationSeconds ?? 0,
    createdAt: toIso(match.createdAt),
    updatedAt: toIso(match.updatedAt),
  }));

  const serializedStats: OfflineLeaderboardStat[] = leaderboardStats.map((stat) => ({
    _id: toId(stat._id),
    gameId: stat.gameId,
    playerId: toId(stat.playerId),
    gamesPlayed: stat.gamesPlayed ?? 0,
    wins: stat.wins ?? 0,
    losses: stat.losses ?? 0,
    winRate: stat.winRate ?? 0,
    currentStreak: stat.currentStreak ?? 0,
    createdAt: toIso(stat.createdAt),
    updatedAt: toIso(stat.updatedAt),
  }));

  const snapshot: OfflineGameSnapshot = {
    version: OFFLINE_SNAPSHOT_VERSION,
    gameId,
    ownerId,
    savedAt: new Date().toISOString(),
    game: gameRecord,
    clubBranding,
    courts,
    queueEntries,
    matches: serializedMatches,
    leaderboardStats: serializedStats,
    players: playersMap,
  };

  return writeOfflineSnapshot(snapshot);
}

export function newOfflineObjectId() {
  return new Types.ObjectId().toString();
}
