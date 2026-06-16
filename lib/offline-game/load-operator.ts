import { buildPlayerSessionStatsMap } from "@/lib/games-played-map";
import type {
  OperatorDetailsPayload,
  OperatorQueuePayload,
  OperatorShellPayload,
} from "@/lib/operator-payload";
import { readOfflineSnapshot } from "@/lib/offline-game/store";
import type { OfflineGameSnapshot, OfflinePlayerRecord } from "@/lib/offline-game/types";

function playerRef(player: OfflinePlayerRecord | undefined) {
  if (!player) {
    return {
      _id: "",
      firstName: "Unknown",
      lastName: "",
      photoUrl: "",
    };
  }
  return {
    _id: player._id,
    firstName: player.firstName,
    lastName: player.lastName,
    photoUrl: player.photoUrl ?? "",
    personalQrCode: player.personalQrCode,
  };
}

function sortByRegisteredAt<T extends { registeredAt: string }>(entries: T[]) {
  return [...entries].sort(
    (a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
  );
}

function mapQueueEntryView(
  entry: OfflineGameSnapshot["queueEntries"][number],
  snapshot: OfflineGameSnapshot,
) {
  const statsMap = buildPlayerSessionStatsMap(
    snapshot.leaderboardStats.map((row) => ({
      playerId: row.playerId,
      gamesPlayed: row.gamesPlayed,
      wins: row.wins,
      losses: row.losses,
    })),
  );
  const player = snapshot.players[entry.playerId];
  const stats = statsMap.get(entry.playerId);

  return {
    _id: entry._id,
    queueType: entry.queueType,
    playerId: playerRef(player),
    registeredAt: entry.registeredAt,
    lastMatchResult: entry.lastMatchResult,
    checkedOutAt: entry.status === "checked_out" ? entry.updatedAt : undefined,
    updatedAt: entry.updatedAt,
    gamesPlayed: stats?.gamesPlayed,
    wins: stats?.wins,
    losses: stats?.losses,
  };
}

function mapCourtView(court: OfflineGameSnapshot["courts"][number], snapshot: OfflineGameSnapshot) {
  const mapPlayers = (ids: string[]) =>
    ids.map((id) => playerRef(snapshot.players[id])).filter((player) => player._id);

  return {
    _id: court._id,
    courtNumber: court.courtNumber,
    status: court.status,
    startedAt: court.startedAt,
    isRematch: court.isRematch,
    teamA: { playerIds: mapPlayers(court.teamA.playerIds) },
    teamB: { playerIds: mapPlayers(court.teamB.playerIds) },
  };
}

function mapMatchView(match: OfflineGameSnapshot["matches"][number], snapshot: OfflineGameSnapshot) {
  const mapTeam = (ids: string[]) => ids.map((id) => playerRef(snapshot.players[id]));

  return {
    _id: match._id,
    courtNumber: match.courtNumber,
    teamAPlayerIds: mapTeam(match.teamAPlayerIds),
    teamBPlayerIds: mapTeam(match.teamBPlayerIds),
    winnerTeam: match.winnerTeam,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    startedAt: match.startedAt,
    durationSeconds: match.durationSeconds,
    endedAt: match.endedAt,
  };
}

export async function loadOfflineOperatorShell(
  gameId: string,
  ownerId: string,
): Promise<OperatorShellPayload | null> {
  const snapshot = await readOfflineSnapshot(gameId);
  if (!snapshot || snapshot.ownerId !== ownerId) return null;

  return {
    game: {
      title: snapshot.game.title,
      openPlayType: snapshot.game.openPlayType,
      courtCount: snapshot.game.courtCount,
      gameId: snapshot.game.gameId,
      status: snapshot.game.status,
      openPlayDate: snapshot.game.openPlayDate,
      openPlayTimeRange: snapshot.game.openPlayTimeRange,
      allowQrRegistration: snapshot.game.allowQrRegistration,
      registerUrl: snapshot.game.registerUrl,
      publicQrCodeDataUrl: snapshot.game.publicQrCodeDataUrl,
    },
    clubBranding: snapshot.clubBranding
      ? {
          clubName: snapshot.clubBranding.clubName ?? "",
          clubLogoUrl: snapshot.clubBranding.clubLogoUrl ?? "",
        }
      : null,
  };
}

export async function loadOfflineOperatorQueueState(
  gameId: string,
  ownerId: string,
): Promise<OperatorQueuePayload | null> {
  const snapshot = await readOfflineSnapshot(gameId);
  if (!snapshot || snapshot.ownerId !== ownerId) return null;

  const queued = sortByRegisteredAt(
    snapshot.queueEntries.filter((entry) => entry.status === "queued"),
  );
  const checkedOut = snapshot.queueEntries
    .filter((entry) => entry.status === "checked_out")
    .sort((a, b) => new Date(b.updatedAt ?? b.registeredAt).getTime() - new Date(a.updatedAt ?? a.registeredAt).getTime());

  return {
    status: snapshot.game.status,
    queue: queued.map((entry) => mapQueueEntryView(entry, snapshot)),
    checkedOut: checkedOut.map((entry) => mapQueueEntryView(entry, snapshot)),
    courts: snapshot.courts
      .slice()
      .sort((a, b) => a.courtNumber - b.courtNumber)
      .map((court) => mapCourtView(court, snapshot)),
  };
}

export async function loadOfflineOperatorDetails(
  gameId: string,
  ownerId: string,
): Promise<OperatorDetailsPayload | null> {
  const snapshot = await readOfflineSnapshot(gameId);
  if (!snapshot || snapshot.ownerId !== ownerId) return null;

  const leaderboard = snapshot.leaderboardStats
    .slice()
    .sort((a, b) => b.wins - a.wins)
    .map((stat) => ({
      playerId: playerRef(snapshot.players[stat.playerId]),
      gamesPlayed: stat.gamesPlayed,
      wins: stat.wins,
      losses: stat.losses,
      winRate: stat.winRate,
      currentStreak: stat.currentStreak,
    }));

  const matches = snapshot.matches
    .slice()
    .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime())
    .map((match) => mapMatchView(match, snapshot));

  return {
    leaderboard,
    matches,
    qr:
      snapshot.game.registerUrl && snapshot.game.publicQrCodeDataUrl
        ? {
            registerUrl: snapshot.game.registerUrl,
            publicQrCodeDataUrl: snapshot.game.publicQrCodeDataUrl,
          }
        : undefined,
  };
}
