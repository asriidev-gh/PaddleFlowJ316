import { Court } from "@/models/Court";
import { LeaderboardStats } from "@/models/LeaderboardStats";
import { MatchHistory } from "@/models/MatchHistory";
import { PickleGame } from "@/models/PickleGame";
import { QueueEntry } from "@/models/QueueEntry";
import {
  clearGameOfflineMode,
  readOfflineSnapshot,
  removeOfflineSnapshot,
} from "@/lib/offline-game/store";
import type {
  OfflineCourt,
  OfflineGameSnapshot,
  OfflineLeaderboardStat,
  OfflineMatch,
  OfflineQueueEntry,
} from "@/lib/offline-game/types";

function toDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function mapQueueEntryDoc(entry: OfflineQueueEntry) {
  return {
    _id: entry._id,
    gameId: entry.gameId,
    playerId: entry.playerId,
    status: entry.status,
    queueType: entry.queueType,
    pairGroupId: entry.pairGroupId,
    deckPlacement: entry.deckPlacement,
    openCourtGroupId: entry.openCourtGroupId,
    openCourtTeam: entry.openCourtTeam,
    registeredAt: new Date(entry.registeredAt),
    winStreak: entry.winStreak,
    lastMatchResult: entry.lastMatchResult,
    createdAt: entry.createdAt ? new Date(entry.createdAt) : undefined,
    updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
  };
}

function mapCourtDoc(court: OfflineCourt) {
  return {
    _id: court._id,
    gameId: court.gameId,
    courtNumber: court.courtNumber,
    status: court.status,
    teamA: {
      playerIds: [...court.teamA.playerIds],
      queueEntryIds: [...court.teamA.queueEntryIds],
    },
    teamB: {
      playerIds: [...court.teamB.playerIds],
      queueEntryIds: [...court.teamB.queueEntryIds],
    },
    startedAt: toDate(court.startedAt),
    isRematch: court.isRematch,
    createdAt: court.createdAt ? new Date(court.createdAt) : undefined,
    updatedAt: court.updatedAt ? new Date(court.updatedAt) : undefined,
  };
}

function mapMatchDoc(match: OfflineMatch) {
  return {
    _id: match._id,
    gameId: match.gameId,
    courtNumber: match.courtNumber,
    teamAPlayerIds: [...match.teamAPlayerIds],
    teamBPlayerIds: [...match.teamBPlayerIds],
    winnerTeam: match.winnerTeam,
    loserTeam: match.loserTeam,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    startedAt: toDate(match.startedAt),
    endedAt: new Date(match.endedAt),
    durationSeconds: match.durationSeconds,
    createdAt: match.createdAt ? new Date(match.createdAt) : undefined,
    updatedAt: match.updatedAt ? new Date(match.updatedAt) : undefined,
  };
}

function mapLeaderboardDoc(stat: OfflineLeaderboardStat) {
  return {
    _id: stat._id,
    gameId: stat.gameId,
    playerId: stat.playerId,
    gamesPlayed: stat.gamesPlayed,
    wins: stat.wins,
    losses: stat.losses,
    winRate: stat.winRate,
    currentStreak: stat.currentStreak,
    createdAt: stat.createdAt ? new Date(stat.createdAt) : undefined,
    updatedAt: stat.updatedAt ? new Date(stat.updatedAt) : undefined,
  };
}

async function replaceGameQueueData(snapshot: OfflineGameSnapshot) {
  await QueueEntry.deleteMany({ gameId: snapshot.gameId });
  if (snapshot.queueEntries.length > 0) {
    await QueueEntry.insertMany(snapshot.queueEntries.map(mapQueueEntryDoc));
  }
}

async function replaceGameCourts(snapshot: OfflineGameSnapshot) {
  for (const court of snapshot.courts) {
    await Court.findOneAndUpdate(
      { gameId: snapshot.gameId, courtNumber: court.courtNumber },
      { $set: mapCourtDoc(court) },
      { upsert: true },
    );
  }

  const courtNumbers = new Set(snapshot.courts.map((court) => court.courtNumber));
  await Court.deleteMany({
    gameId: snapshot.gameId,
    courtNumber: { $nin: [...courtNumbers] },
  });
}

async function replaceGameMatches(snapshot: OfflineGameSnapshot) {
  const matchIds = snapshot.matches.map((match) => match._id);
  await MatchHistory.deleteMany({
    gameId: snapshot.gameId,
    _id: { $nin: matchIds },
  });

  for (const match of snapshot.matches) {
    await MatchHistory.findOneAndUpdate({ _id: match._id }, mapMatchDoc(match), {
      upsert: true,
    });
  }
}

async function replaceLeaderboardStats(snapshot: OfflineGameSnapshot) {
  const statIds = snapshot.leaderboardStats.map((stat) => stat._id);
  await LeaderboardStats.deleteMany({
    gameId: snapshot.gameId,
    _id: { $nin: statIds },
  });

  for (const stat of snapshot.leaderboardStats) {
    await LeaderboardStats.findOneAndUpdate({ _id: stat._id }, mapLeaderboardDoc(stat), {
      upsert: true,
    });
  }
}

export async function syncOfflineSnapshotToMongo(gameId: string, ownerId: string) {
  const snapshot = await readOfflineSnapshot(gameId);
  if (!snapshot) {
    throw new Error("Offline snapshot not found for this game.");
  }
  if (snapshot.ownerId !== ownerId) {
    throw new Error("You do not own this offline game snapshot.");
  }

  const game = snapshot.game;
  await PickleGame.findOneAndUpdate(
    { gameId, ownerId },
    {
      $set: {
        title: game.title,
        openPlayType: game.openPlayType,
        openPlayDate: game.openPlayDate ? new Date(game.openPlayDate) : null,
        openPlayTimeRange: game.openPlayTimeRange ?? "",
        courtCount: game.courtCount,
        expectedPlayers: game.expectedPlayers,
        strictPlayerCount: game.strictPlayerCount,
        allowQrRegistration: game.allowQrRegistration,
        registrationMode: game.registrationMode,
        registerUrl: game.registerUrl,
        publicQrCodeDataUrl: game.publicQrCodeDataUrl,
        status: game.status,
      },
    },
    { upsert: false },
  );

  await replaceGameCourts(snapshot);
  await replaceGameQueueData(snapshot);
  await replaceGameMatches(snapshot);
  await replaceLeaderboardStats(snapshot);

  await clearGameOfflineMode(gameId);
  await removeOfflineSnapshot(gameId);

  return {
    syncedAt: new Date().toISOString(),
    queueEntries: snapshot.queueEntries.length,
    matches: snapshot.matches.length,
  };
}
