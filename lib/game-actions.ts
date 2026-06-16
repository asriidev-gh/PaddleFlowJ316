import { runWithDatabase } from "@/lib/db";
import {
  loadOperatorDetails,
  loadOperatorQueueState,
  loadOperatorShell,
} from "@/lib/load-operator-game";
import { getOperatorAuthUser } from "@/lib/offline-game/auth";
import {
  loadOfflineOperatorDetails,
  loadOfflineOperatorQueueState,
  loadOfflineOperatorShell,
} from "@/lib/offline-game/load-operator";
import {
  maybeAutoEnterOfflineMode,
  refreshOfflineShadowFromMongo,
} from "@/lib/offline-game/mode";
import {
  offlineCancelCourtAssignment,
  offlineCancelRematch,
  offlineCheckBackIn,
  offlineCheckOutFromQueue,
  offlineEndGameAndRequeue,
  offlineEndOpenPlay,
  offlinePromoteDeckMatchToOpenCourt,
  offlineRemovePlayerFromGame,
  offlineReorderQueuedPlayers,
  offlineReplaceCourtPlayerWithWaiting,
  offlineShuffleNextOnCourtInQueue,
  offlineStartGameOnCourt,
  offlineSwapNextInQueue,
  offlineSwapPlayersBetweenCourtTeams,
} from "@/lib/offline-game/queue-engine";
import { isGameInOfflineMode } from "@/lib/offline-game/store";
import {
  cancelCourtAssignment,
  cancelRematch,
  endGameAndRequeue,
  promoteDeckMatchToOpenCourt,
  reorderQueuedPlayers,
  replaceCourtPlayerWithWaiting,
  shuffleNextOnCourtInQueue,
  startGameOnCourt,
  swapPlayersBetweenCourtTeams,
} from "@/lib/queue-engine";
import { removePlayerFromGame } from "@/lib/remove-game-player";
import { PickleGame } from "@/models/PickleGame";
import { QueueEntry } from "@/models/QueueEntry";
import "@/models/Player";

export { getOperatorAuthUser };

async function runGameStorage(
  gameId: string,
  ownerId: string,
  offline: () => Promise<unknown>,
  online: () => Promise<unknown>,
): Promise<unknown> {
  if (await isGameInOfflineMode(gameId)) {
    return offline();
  }

  try {
    const result = await runWithDatabase(online);
    void refreshOfflineShadowFromMongo(gameId, ownerId);
    return result;
  } catch (error) {
    if (await maybeAutoEnterOfflineMode(gameId, ownerId, error)) {
      return offline();
    }
    throw error;
  }
}

export async function loadOperatorShellForGame(gameId: string, ownerId: string) {
  if (await isGameInOfflineMode(gameId)) {
    return loadOfflineOperatorShell(gameId, ownerId);
  }
  try {
    const payload = await runWithDatabase(() => loadOperatorShell(gameId, ownerId));
    void refreshOfflineShadowFromMongo(gameId, ownerId);
    return payload;
  } catch (error) {
    if (await maybeAutoEnterOfflineMode(gameId, ownerId, error)) {
      return loadOfflineOperatorShell(gameId, ownerId);
    }
    throw error;
  }
}

export async function loadOperatorQueueForGame(gameId: string, ownerId: string) {
  if (await isGameInOfflineMode(gameId)) {
    return loadOfflineOperatorQueueState(gameId, ownerId);
  }
  try {
    const payload = await runWithDatabase(() => loadOperatorQueueState(gameId, ownerId));
    void refreshOfflineShadowFromMongo(gameId, ownerId);
    return payload;
  } catch (error) {
    if (await maybeAutoEnterOfflineMode(gameId, ownerId, error)) {
      return loadOfflineOperatorQueueState(gameId, ownerId);
    }
    throw error;
  }
}

export async function loadOperatorDetailsForGame(gameId: string, ownerId: string) {
  if (await isGameInOfflineMode(gameId)) {
    return loadOfflineOperatorDetails(gameId, ownerId);
  }
  try {
    const payload = await runWithDatabase(() => loadOperatorDetails(gameId, ownerId));
    void refreshOfflineShadowFromMongo(gameId, ownerId);
    return payload;
  } catch (error) {
    if (await maybeAutoEnterOfflineMode(gameId, ownerId, error)) {
      return loadOfflineOperatorDetails(gameId, ownerId);
    }
    throw error;
  }
}

async function assertActiveGameOnline(gameId: string, ownerId: string) {
  const game = await PickleGame.findOne({ gameId, ownerId });
  if (!game) throw new Error("Game not found.");
  if (game.status === "ended") {
    throw new Error("Open play has ended. Reset the game to restart.");
  }
  return game;
}

export async function actionStartGame(gameId: string, ownerId: string, courtNumber?: number) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineStartGameOnCourt(gameId, courtNumber),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      return startGameOnCourt(gameId, courtNumber);
    },
  );
}

export async function actionEndGame(
  gameId: string,
  ownerId: string,
  input: {
    courtNumber: number;
    winnerTeam: "A" | "B";
    teamAScore: number;
    teamBScore: number;
    rematch?: boolean;
  },
) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineEndGameAndRequeue({ gameId, ...input }),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      return endGameAndRequeue({ gameId, ...input });
    },
  );
}

export async function actionShuffleNext(gameId: string, ownerId: string) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineShuffleNextOnCourtInQueue(gameId),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      return shuffleNextOnCourtInQueue(gameId);
    },
  );
}

export async function actionReorderQueue(
  gameId: string,
  ownerId: string,
  orderedEntryIds: string[],
) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineReorderQueuedPlayers(gameId, orderedEntryIds),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      return reorderQueuedPlayers(gameId, orderedEntryIds);
    },
  );
}

export async function actionSwapCourt(
  gameId: string,
  ownerId: string,
  input: { courtNumber: number; slotIndex?: number },
) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineSwapPlayersBetweenCourtTeams({ gameId, ...input }),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      return swapPlayersBetweenCourtTeams({ gameId, ...input });
    },
  );
}

export async function actionCancelCourt(gameId: string, ownerId: string, courtNumber: number) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineCancelCourtAssignment({ gameId, courtNumber }),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      return cancelCourtAssignment({ gameId, courtNumber });
    },
  );
}

export async function actionCancelRematch(gameId: string, ownerId: string, courtNumber: number) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineCancelRematch({ gameId, courtNumber }),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      return cancelRematch({ gameId, courtNumber });
    },
  );
}

export async function actionReplaceCourtPlayer(
  gameId: string,
  ownerId: string,
  input: {
    courtNumber: number;
    team: "A" | "B";
    slotIndex: number;
    targetIndex: number;
  },
) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineReplaceCourtPlayerWithWaiting({ gameId, ...input }),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      return replaceCourtPlayerWithWaiting({ gameId, ...input });
    },
  );
}

export async function actionPromoteDeck(
  gameId: string,
  ownerId: string,
  input: { teamAEntryIds: string[]; teamBEntryIds: string[] },
) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlinePromoteDeckMatchToOpenCourt({ gameId, ...input }),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      return promoteDeckMatchToOpenCourt({ gameId, ...input });
    },
  );
}

export async function actionSwapNext(
  gameId: string,
  ownerId: string,
  sourceIndex: number,
  targetIndex: number,
) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineSwapNextInQueue({ gameId, sourceIndex, targetIndex }),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      const queue = await QueueEntry.find({ gameId, status: "queued" }).sort({ registeredAt: 1 });
      if (targetIndex >= queue.length) {
        throw new Error("Selected player is not in the waiting line.");
      }
      if (targetIndex === sourceIndex) {
        throw new Error("Cannot swap a player with themselves.");
      }
      const reorderedQueue = [...queue];
      [reorderedQueue[sourceIndex], reorderedQueue[targetIndex]] = [
        reorderedQueue[targetIndex],
        reorderedQueue[sourceIndex],
      ];
      const baseTime =
        reorderedQueue.length > 0
          ? new Date(reorderedQueue[0].registeredAt).getTime()
          : Date.now();
      await Promise.all(
        reorderedQueue.map((entry, index) =>
          QueueEntry.updateOne(
            { _id: entry._id },
            { $set: { registeredAt: new Date(baseTime + index * 1000) } },
          ),
        ),
      );
    },
  );
}

export async function actionCheckBackIn(gameId: string, ownerId: string, queueEntryId: string) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineCheckBackIn({ gameId, queueEntryId }),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      const checkedOutEntry = await QueueEntry.findOne({
        _id: queueEntryId,
        gameId,
        status: "checked_out",
      }).select("playerId");
      if (!checkedOutEntry) throw new Error("Checked-out player not found.");

      const alreadyQueued = await QueueEntry.findOne({
        gameId,
        status: "queued",
        playerId: checkedOutEntry.playerId,
      }).select("_id");
      if (alreadyQueued) throw new Error("Player is already in the queue.");

      const lastQueued = await QueueEntry.findOne({ gameId, status: "queued" })
        .sort({ registeredAt: -1 })
        .select("registeredAt")
        .lean<{ registeredAt?: Date } | null>();

      const baseTime = lastQueued?.registeredAt
        ? new Date(lastQueued.registeredAt).getTime()
        : Date.now();
      const registeredAt = new Date(baseTime + 1000);

      const entry = await QueueEntry.findOneAndUpdate(
        { _id: queueEntryId, gameId, status: "checked_out" },
        {
          $set: {
            status: "queued",
            queueType: "normal",
            pairGroupId: null,
            registeredAt,
          },
        },
        { returnDocument: "after" },
      ).populate("playerId", "firstName lastName");

      if (!entry) throw new Error("Checked-out player not found.");
      const player = entry.playerId as { firstName?: string; lastName?: string } | null;
      const name = [player?.firstName, player?.lastName].filter(Boolean).join(" ").trim() || "Player";
      return { message: `${name} checked back in at the end of the queue.` };
    },
  );
}

export async function actionRemovePlayer(gameId: string, ownerId: string, playerId: string) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineRemovePlayerFromGame({ gameId, playerId }),
    async () => {
      await assertActiveGameOnline(gameId, ownerId);
      return removePlayerFromGame({ gameId, playerId });
    },
  );
}

export async function actionCheckOutQueueEntry(gameId: string, queueEntryId: string) {
  if (await isGameInOfflineMode(gameId)) {
    return offlineCheckOutFromQueue({ gameId, queueEntryId });
  }

  return runWithDatabase(async () => {
    const game = await PickleGame.findOne({ gameId });
    if (!game) throw new Error("Game not found.");
    if (game.status === "ended") {
      throw new Error("Open play has ended. Reset the game to restart.");
    }

    const entry = await QueueEntry.findOneAndUpdate(
      { _id: queueEntryId, gameId, status: "queued" },
      { $set: { status: "checked_out" } },
      { returnDocument: "after" },
    ).populate("playerId", "firstName lastName");

    if (!entry) throw new Error("Queued player not found.");

    const player = entry.playerId as { firstName?: string; lastName?: string } | null;
    const name = [player?.firstName, player?.lastName].filter(Boolean).join(" ").trim() || "Player";
    void refreshOfflineShadowFromMongo(gameId, game.ownerId.toString());
    return { message: `${name} checked out of the queue.` };
  });
}

export async function actionEndOpenPlay(gameId: string, ownerId: string) {
  return runGameStorage(
    gameId,
    ownerId,
    () => offlineEndOpenPlay(gameId),
    async () => {
      const game = await PickleGame.findOneAndUpdate(
        { gameId, ownerId },
        { $set: { status: "ended" } },
        { returnDocument: "after" },
      );
      if (!game) throw new Error("Game not found.");
      return { message: "Open play ended successfully." };
    },
  );
}
