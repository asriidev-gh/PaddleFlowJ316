import { nanoid } from "nanoid";

import { COURT_CANCEL_GRACE_MS } from "@/lib/court-cancel-grace";
import { newOfflineObjectId } from "@/lib/offline-game/export-from-mongo";
import { withOfflineSnapshot } from "@/lib/offline-game/store";
import type {
  OfflineCourt,
  OfflineGameSnapshot,
  OfflineLeaderboardStat,
  OfflineQueueEntry,
} from "@/lib/offline-game/types";

type CourtSlot = { playerId: string; queueEntryId: string };

function nowIso() {
  return new Date().toISOString();
}

function findCourt(snapshot: OfflineGameSnapshot, courtNumber: number, status?: "empty" | "active") {
  return snapshot.courts.find(
    (court) =>
      court.courtNumber === courtNumber && (status == null || court.status === status),
  );
}

function findEmptyCourt(snapshot: OfflineGameSnapshot, courtNumber?: number) {
  if (courtNumber != null) {
    return findCourt(snapshot, courtNumber, "empty") ?? null;
  }
  return (
    snapshot.courts
      .filter((court) => court.status === "empty")
      .sort((a, b) => a.courtNumber - b.courtNumber)[0] ?? null
  );
}

function queuedEntries(snapshot: OfflineGameSnapshot) {
  return snapshot.queueEntries
    .filter((entry) => entry.status === "queued")
    .sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
}

function persistQueueOrder(snapshot: OfflineGameSnapshot, orderedEntries: OfflineQueueEntry[]) {
  const baseTime =
    orderedEntries.length > 0
      ? new Date(orderedEntries[0].registeredAt).getTime()
      : Date.now();

  for (const [index, entry] of orderedEntries.entries()) {
    const target = snapshot.queueEntries.find((row) => row._id === entry._id);
    if (!target) continue;
    target.registeredAt = new Date(baseTime + index * 1000).toISOString();
    target.updatedAt = nowIso();
  }
}

function shuffleSlots<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function teamKey(slots: CourtSlot[]): string {
  return slots
    .map((slot) => slot.playerId)
    .sort()
    .join(",");
}

function shuffleIntoNewHalves<T>(
  items: T[],
  teamKeyForHalf: (half: T[]) => string,
): { firstHalf: T[]; secondHalf: T[] } {
  if (items.length < 2) {
    throw new Error("Not enough players to shuffle.");
  }

  const half = Math.floor(items.length / 2);
  const currentKey = teamKeyForHalf(items.slice(0, half));

  let shuffled = items;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    shuffled = shuffleSlots(items);
    if (teamKeyForHalf(shuffled.slice(0, half)) !== currentKey) break;
  }

  return { firstHalf: shuffled.slice(0, half), secondHalf: shuffled.slice(half) };
}

function recalculateLeaderboardWinRates(snapshot: OfflineGameSnapshot) {
  for (const stat of snapshot.leaderboardStats) {
    stat.winRate =
      stat.gamesPlayed > 0 ? Math.round((stat.wins / stat.gamesPlayed) * 100) : 0;
    stat.updatedAt = nowIso();
  }
}

function upsertLeaderboardStat(
  snapshot: OfflineGameSnapshot,
  playerId: string,
  hasWon: boolean,
) {
  let stat = snapshot.leaderboardStats.find((row) => row.playerId === playerId);
  if (!stat) {
    stat = {
      _id: newOfflineObjectId(),
      gameId: snapshot.gameId,
      playerId,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      currentStreak: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    snapshot.leaderboardStats.push(stat);
  }

  stat.gamesPlayed += 1;
  if (hasWon) {
    stat.wins += 1;
    stat.currentStreak += 1;
  } else {
    stat.losses += 1;
    stat.currentStreak -= 1;
  }
  stat.updatedAt = nowIso();
}

function courtSlots(court: OfflineCourt): CourtSlot[] {
  return [
    ...court.teamA.playerIds.map((playerId, index) => ({
      playerId,
      queueEntryId: court.teamA.queueEntryIds[index],
    })),
    ...court.teamB.playerIds.map((playerId, index) => ({
      playerId,
      queueEntryId: court.teamB.queueEntryIds[index],
    })),
  ];
}

export async function offlineStartGameOnCourt(gameId: string, courtNumber?: number) {
  return withOfflineSnapshot(gameId, (snapshot) => {
    if (snapshot.game.status === "ended") {
      throw new Error("Open play has ended. Reset the game to restart.");
    }

    const court = findEmptyCourt(snapshot, courtNumber);
    if (!court) {
      throw new Error(
        courtNumber != null
          ? `Court ${courtNumber} is not available.`
          : "No empty court available.",
      );
    }

    const entries = queuedEntries(snapshot).slice(0, 4);
    if (entries.length < 4) {
      throw new Error("Not enough queued players. At least 4 players are required.");
    }

    const [p1, p2, p3, p4] = entries;
    for (const entry of entries) {
      entry.status = "on_court";
      entry.updatedAt = nowIso();
    }

    court.status = "active";
    court.startedAt = nowIso();
    court.isRematch = false;
    court.teamA = { playerIds: [p1.playerId, p2.playerId], queueEntryIds: [p1._id, p2._id] };
    court.teamB = { playerIds: [p3.playerId, p4.playerId], queueEntryIds: [p3._id, p4._id] };
    court.updatedAt = nowIso();

    return court;
  });
}

export async function offlineReorderQueuedPlayers(gameId: string, orderedEntryIds: string[]) {
  return withOfflineSnapshot(gameId, (snapshot) => {
    const queue = queuedEntries(snapshot);
    if (orderedEntryIds.length !== queue.length) {
      throw new Error("Queue order must include every queued player exactly once.");
    }

    const byId = new Map(queue.map((entry) => [entry._id, entry]));
    const seen = new Set<string>();
    const reordered = orderedEntryIds.map((entryId) => {
      if (seen.has(entryId)) {
        throw new Error("Queue order must include every queued player exactly once.");
      }
      seen.add(entryId);
      const entry = byId.get(entryId);
      if (!entry) throw new Error("Invalid queue entry in reorder request.");
      return entry;
    });

    persistQueueOrder(snapshot, reordered);
  });
}

export async function offlineShuffleNextOnCourtInQueue(gameId: string) {
  return withOfflineSnapshot(gameId, (snapshot) => {
    const queue = queuedEntries(snapshot);
    if (queue.length < 4) {
      throw new Error("Not enough queued players. At least 4 players are required.");
    }

    const nextUp = queue.slice(0, 4);
    const { firstHalf, secondHalf } = shuffleIntoNewHalves(nextUp, (half) =>
      teamKey(
        half.map((entry) => ({
          playerId: entry.playerId,
          queueEntryId: entry._id,
        })),
      ),
    );

    persistQueueOrder(snapshot, [...firstHalf, ...secondHalf, ...queue.slice(4)]);
  });
}

export async function offlinePromoteDeckMatchToOpenCourt(input: {
  gameId: string;
  teamAEntryIds: string[];
  teamBEntryIds: string[];
}) {
  return withOfflineSnapshot(input.gameId, (snapshot) => {
    const allIds = [...input.teamAEntryIds, ...input.teamBEntryIds];
    if (new Set(allIds).size !== 4) {
      throw new Error("All four queue entry ids must be unique.");
    }

    const entries = snapshot.queueEntries.filter(
      (entry) => entry.status === "queued" && allIds.includes(entry._id),
    );
    if (entries.length !== 4) {
      throw new Error("One or more players are not in the queue.");
    }

    const openCourtGroupId = `OC-${nanoid(8)}`;
    for (const id of input.teamAEntryIds) {
      const entry = snapshot.queueEntries.find((row) => row._id === id);
      if (!entry) throw new Error("One or more queue entries were not found.");
      entry.deckPlacement = "open_court";
      entry.openCourtGroupId = openCourtGroupId;
      entry.openCourtTeam = "A";
      entry.updatedAt = nowIso();
    }
    for (const id of input.teamBEntryIds) {
      const entry = snapshot.queueEntries.find((row) => row._id === id);
      if (!entry) throw new Error("One or more queue entries were not found.");
      entry.deckPlacement = "open_court";
      entry.openCourtGroupId = openCourtGroupId;
      entry.openCourtTeam = "B";
      entry.updatedAt = nowIso();
    }

    const queue = queuedEntries(snapshot);
    const promoteSet = new Set(allIds);
    const others = queue.filter((entry) => !promoteSet.has(entry._id));
    const byId = new Map(entries.map((entry) => [entry._id, entry]));
    const promotedOrdered = [
      ...input.teamAEntryIds.map((id) => byId.get(id)!),
      ...input.teamBEntryIds.map((id) => byId.get(id)!),
    ];
    persistQueueOrder(snapshot, [...others, ...promotedOrdered]);
  });
}

export async function offlineSwapPlayersBetweenCourtTeams(input: {
  gameId: string;
  courtNumber: number;
  slotIndex?: number;
}) {
  return withOfflineSnapshot(input.gameId, (snapshot) => {
    const court = findCourt(snapshot, input.courtNumber, "active");
    if (!court) throw new Error("Active court not found.");

    const slots = courtSlots(court);
    const { firstHalf: nextA, secondHalf: nextB } = shuffleIntoNewHalves(slots, teamKey);

    court.teamA = {
      playerIds: nextA.map((slot) => slot.playerId),
      queueEntryIds: nextA.map((slot) => slot.queueEntryId),
    };
    court.teamB = {
      playerIds: nextB.map((slot) => slot.playerId),
      queueEntryIds: nextB.map((slot) => slot.queueEntryId),
    };
    court.updatedAt = nowIso();
    return court;
  });
}

async function offlineCancelCourtLike(
  gameId: string,
  courtNumber: number,
  options: { rematchOnly: boolean; courtEntriesFirst: boolean },
) {
  return withOfflineSnapshot(gameId, (snapshot) => {
    const court = findCourt(snapshot, courtNumber, "active");
    if (!court) throw new Error("Active court not found.");
    if (options.rematchOnly && !court.isRematch) {
      throw new Error("This court is not in a rematch.");
    }

    if (!court.startedAt) throw new Error("Court start time is missing.");

    const elapsedMs = Date.now() - new Date(court.startedAt).getTime();
    if (elapsedMs > COURT_CANCEL_GRACE_MS) {
      throw new Error("The cancel window has expired. Players are already in play.");
    }

    const courtQueueEntryIds = [...court.teamA.queueEntryIds, ...court.teamB.queueEntryIds];
    if (courtQueueEntryIds.length !== 4) {
      throw new Error("Court does not have a full assignment to cancel.");
    }

    const courtEntries = snapshot.queueEntries.filter(
      (entry) => courtQueueEntryIds.includes(entry._id) && entry.status === "on_court",
    );
    if (courtEntries.length !== 4) {
      throw new Error("One or more court players are no longer on court.");
    }

    const otherQueued = queuedEntries(snapshot);
    const courtEntriesOrdered = [...courtEntries].sort(
      (a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
    );

    court.status = "empty";
    court.teamA = { playerIds: [], queueEntryIds: [] };
    court.teamB = { playerIds: [], queueEntryIds: [] };
    court.startedAt = null;
    court.isRematch = false;
    court.updatedAt = nowIso();

    for (const entry of courtEntries) {
      entry.status = "queued";
      entry.updatedAt = nowIso();
    }

    persistQueueOrder(
      snapshot,
      options.courtEntriesFirst
        ? [...courtEntriesOrdered, ...otherQueued]
        : [...otherQueued, ...courtEntriesOrdered],
    );

    return court;
  });
}

export async function offlineCancelCourtAssignment(input: { gameId: string; courtNumber: number }) {
  return offlineCancelCourtLike(input.gameId, input.courtNumber, {
    rematchOnly: false,
    courtEntriesFirst: true,
  });
}

export async function offlineCancelRematch(input: { gameId: string; courtNumber: number }) {
  return offlineCancelCourtLike(input.gameId, input.courtNumber, {
    rematchOnly: true,
    courtEntriesFirst: false,
  });
}

export async function offlineReplaceCourtPlayerWithWaiting(input: {
  gameId: string;
  courtNumber: number;
  team: "A" | "B";
  slotIndex: number;
  targetIndex: number;
}) {
  return withOfflineSnapshot(input.gameId, (snapshot) => {
    if (input.slotIndex < 0 || input.slotIndex > 1) {
      throw new Error("slotIndex must be 0 or 1.");
    }

    const court = findCourt(snapshot, input.courtNumber, "active");
    if (!court) throw new Error("Active court not found.");

    const team = input.team === "A" ? court.teamA : court.teamB;
    if (input.slotIndex >= team.playerIds.length) {
      throw new Error("Invalid player slot on court.");
    }

    const courtEntry = snapshot.queueEntries.find(
      (entry) => entry._id === team.queueEntryIds[input.slotIndex],
    );
    if (!courtEntry || courtEntry.status !== "on_court") {
      throw new Error("Court player queue entry not found.");
    }

    const queue = queuedEntries(snapshot);
    if (input.targetIndex < 0 || input.targetIndex >= queue.length) {
      throw new Error("Selected player is not in the queue.");
    }

    const queuedEntry = queue[input.targetIndex];
    team.playerIds[input.slotIndex] = queuedEntry.playerId;
    team.queueEntryIds[input.slotIndex] = queuedEntry._id;
    court.updatedAt = nowIso();

    const reordered = [
      ...queue.slice(0, input.targetIndex),
      courtEntry,
      ...queue.slice(input.targetIndex + 1),
    ];
    persistQueueOrder(snapshot, reordered);

    queuedEntry.status = "on_court";
    queuedEntry.updatedAt = nowIso();
    courtEntry.status = "queued";
    courtEntry.updatedAt = nowIso();

    return court;
  });
}

export async function offlineEndGameAndRequeue(input: {
  gameId: string;
  courtNumber: number;
  winnerTeam: "A" | "B";
  teamAScore: number;
  teamBScore: number;
  rematch?: boolean;
}) {
  return withOfflineSnapshot(input.gameId, (snapshot) => {
    const court = findCourt(snapshot, input.courtNumber, "active");
    if (!court) throw new Error("Active court not found.");

    const winnerPlayers =
      input.winnerTeam === "A" ? court.teamA.playerIds : court.teamB.playerIds;
    const loserPlayers =
      input.winnerTeam === "A" ? court.teamB.playerIds : court.teamA.playerIds;
    const winnerPlayerIdSet = new Set(winnerPlayers);

    const endedAt = nowIso();
    const startedAt = court.startedAt ?? endedAt;
    const durationSeconds = court.startedAt
      ? Math.max(0, Math.floor((Date.now() - new Date(court.startedAt).getTime()) / 1000))
      : 0;

    snapshot.matches.unshift({
      _id: newOfflineObjectId(),
      gameId: input.gameId,
      courtNumber: input.courtNumber,
      teamAPlayerIds: [...court.teamA.playerIds],
      teamBPlayerIds: [...court.teamB.playerIds],
      winnerTeam: input.winnerTeam,
      loserTeam: input.winnerTeam === "A" ? "B" : "A",
      teamAScore: input.teamAScore,
      teamBScore: input.teamBScore,
      startedAt,
      endedAt,
      durationSeconds,
      createdAt: endedAt,
      updatedAt: endedAt,
    });

    for (const playerId of [...winnerPlayers, ...loserPlayers]) {
      upsertLeaderboardStat(snapshot, playerId, winnerPlayerIdSet.has(playerId));
    }
    recalculateLeaderboardWinRates(snapshot);

    if (input.rematch) {
      court.startedAt = nowIso();
      court.isRematch = true;
      court.updatedAt = nowIso();
      return {
        ok: true,
        rematch: true,
        message: `Court ${input.courtNumber} rematch started — same players, fresh clock.`,
      };
    }

    const teamAPlayers = [...court.teamA.playerIds];
    const teamBPlayers = [...court.teamB.playerIds];
    const requeueOrder = [teamAPlayers[0], teamBPlayers[0], teamAPlayers[1], teamBPlayers[1]].filter(
      Boolean,
    );

    const winnerPairGroupId = `W-${nanoid(8)}`;
    const loserPairGroupId = `L-${nanoid(8)}`;
    const baseTime = Date.now();

    for (const [index, playerId] of requeueOrder.entries()) {
      const isWinner = winnerPlayerIdSet.has(playerId);
      snapshot.queueEntries.push({
        _id: newOfflineObjectId(),
        gameId: input.gameId,
        playerId,
        status: "queued",
        queueType: isWinner ? "winner" : "loser",
        pairGroupId: isWinner ? winnerPairGroupId : loserPairGroupId,
        deckPlacement: null,
        openCourtGroupId: null,
        openCourtTeam: null,
        registeredAt: new Date(baseTime + index).toISOString(),
        winStreak: isWinner ? 1 : 0,
        lastMatchResult: isWinner ? "win" : "loss",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    for (const entryId of [...court.teamA.queueEntryIds, ...court.teamB.queueEntryIds]) {
      const entry = snapshot.queueEntries.find((row) => row._id === entryId);
      if (entry) {
        entry.status = "done";
        entry.updatedAt = nowIso();
      }
    }

    court.status = "empty";
    court.teamA = { playerIds: [], queueEntryIds: [] };
    court.teamB = { playerIds: [], queueEntryIds: [] };
    court.startedAt = null;
    court.isRematch = false;
    court.updatedAt = nowIso();

    return {
      ok: true,
      rematch: false,
      message: "Game ended and players returned to the queue.",
    };
  });
}

export async function offlineSwapNextInQueue(input: {
  gameId: string;
  sourceIndex: number;
  targetIndex: number;
}) {
  return withOfflineSnapshot(input.gameId, (snapshot) => {
    const queue = queuedEntries(snapshot);
    if (input.targetIndex >= queue.length) {
      throw new Error("Selected player is not in the waiting line.");
    }
    if (input.targetIndex === input.sourceIndex) {
      throw new Error("Cannot swap a player with themselves.");
    }

    const reorderedQueue = [...queue];
    [reorderedQueue[input.sourceIndex], reorderedQueue[input.targetIndex]] = [
      reorderedQueue[input.targetIndex],
      reorderedQueue[input.sourceIndex],
    ];
    persistQueueOrder(snapshot, reorderedQueue);
  });
}

export async function offlineCheckOutFromQueue(input: {
  gameId: string;
  queueEntryId: string;
}) {
  return withOfflineSnapshot(input.gameId, (snapshot) => {
    const entry = snapshot.queueEntries.find(
      (row) => row._id === input.queueEntryId && row.status === "queued",
    );
    if (!entry) throw new Error("Queued player not found.");

    entry.status = "checked_out";
    entry.updatedAt = nowIso();

    const player = snapshot.players[entry.playerId];
    const name = [player?.firstName, player?.lastName].filter(Boolean).join(" ").trim() || "Player";
    return { message: `${name} checked out of the queue.` };
  });
}

export async function offlineCheckBackIn(input: { gameId: string; queueEntryId: string }) {
  return withOfflineSnapshot(input.gameId, (snapshot) => {
    const checkedOutEntry = snapshot.queueEntries.find(
      (row) => row._id === input.queueEntryId && row.status === "checked_out",
    );
    if (!checkedOutEntry) throw new Error("Checked-out player not found.");

    const alreadyQueued = snapshot.queueEntries.find(
      (row) => row.status === "queued" && row.playerId === checkedOutEntry.playerId,
    );
    if (alreadyQueued) throw new Error("Player is already in the queue.");

    const queue = queuedEntries(snapshot);
    const baseTime =
      queue.length > 0
        ? new Date(queue[queue.length - 1].registeredAt).getTime()
        : Date.now();

    checkedOutEntry.status = "queued";
    checkedOutEntry.queueType = "normal";
    checkedOutEntry.pairGroupId = null;
    checkedOutEntry.registeredAt = new Date(baseTime + 1000).toISOString();
    checkedOutEntry.updatedAt = nowIso();

    const player = snapshot.players[checkedOutEntry.playerId];
    const name = [player?.firstName, player?.lastName].filter(Boolean).join(" ").trim() || "Player";
    return { message: `${name} checked back in at the end of the queue.` };
  });
}

export async function offlineRemovePlayerFromGame(input: { gameId: string; playerId: string }) {
  return withOfflineSnapshot(input.gameId, (snapshot) => {
    const onCourt = snapshot.courts.some(
      (court) =>
        court.status === "active" &&
        (court.teamA.playerIds.includes(input.playerId) ||
          court.teamB.playerIds.includes(input.playerId)),
    );
    const player = snapshot.players[input.playerId];
    const name = [player?.firstName, player?.lastName].filter(Boolean).join(" ").trim() || "Player";

    if (onCourt) {
      throw new Error(
        `${name} is currently on a court. Replace them or cancel the court assignment before removing.`,
      );
    }

    const hadEntries = snapshot.queueEntries.some((entry) => entry.playerId === input.playerId);
    const hadStats = snapshot.leaderboardStats.some((stat) => stat.playerId === input.playerId);
    if (!hadEntries && !hadStats) {
      throw new Error("Player is not registered for this open play.");
    }

    snapshot.queueEntries = snapshot.queueEntries.filter(
      (entry) => entry.playerId !== input.playerId,
    );
    snapshot.leaderboardStats = snapshot.leaderboardStats.filter(
      (stat) => stat.playerId !== input.playerId,
    );
    snapshot.matches = snapshot.matches.filter(
      (match) =>
        !match.teamAPlayerIds.includes(input.playerId) &&
        !match.teamBPlayerIds.includes(input.playerId),
    );

    return { playerName: name };
  });
}

export async function offlineEndOpenPlay(gameId: string) {
  return withOfflineSnapshot(gameId, (snapshot) => {
    snapshot.game.status = "ended";
    return { message: "Open play ended successfully." };
  });
}
