export type QueueType = "normal" | "winner" | "loser";
export type BracketSource = "winner_bracket" | "loser_bracket";

export type EnginePlayer = {
  id: string;
  name: string;
};

export type EngineQueueEntry = {
  id: string;
  player: EnginePlayer;
  queueType: QueueType;
  pairGroupId?: string | null;
  bracketSource?: BracketSource | null;
};

export type EngineCourt = {
  id: string;
  teamA: [EngineQueueEntry, EngineQueueEntry];
  teamB: [EngineQueueEntry, EngineQueueEntry];
};

export type EngineDeck = {
  pair?: [EngineQueueEntry, EngineQueueEntry];
};

export type EngineState = {
  queue: EngineQueueEntry[];
  winnerDeck: EngineDeck;
  loserDeck: EngineDeck;
  recentFoursomes: string[];
};

export type CourtResult = {
  court: EngineCourt;
  winners: [EngineQueueEntry, EngineQueueEntry];
  losers: [EngineQueueEntry, EngineQueueEntry];
};

const MAX_RECENT_FOURSOMES = 20;

function ensureEvenQueue(entries: EngineQueueEntry[]) {
  if (entries.length % 2 !== 0) {
    throw new Error("Win Lose Bracket requires an even number of players.");
  }
}

function fourKey(entries: EngineQueueEntry[]): string {
  return entries
    .map((entry) => entry.player.id)
    .sort()
    .join(",");
}

function pushRecentFoursome(state: EngineState, entries: EngineQueueEntry[]) {
  const key = fourKey(entries);
  state.recentFoursomes = [key, ...state.recentFoursomes.filter((value) => value !== key)].slice(
    0,
    MAX_RECENT_FOURSOMES,
  );
}

function isImmediateRepeat(state: EngineState, entries: EngineQueueEntry[]) {
  if (state.recentFoursomes.length === 0) return false;
  return state.recentFoursomes[0] === fourKey(entries);
}

function removeByIds(queue: EngineQueueEntry[], ids: string[]) {
  const idSet = new Set(ids);
  return queue.filter((entry) => !idSet.has(entry.id));
}

function toMainQueue(
  pairA: [EngineQueueEntry, EngineQueueEntry],
  pairB: [EngineQueueEntry, EngineQueueEntry],
  source: BracketSource,
): EngineQueueEntry[] {
  return [...pairA, ...pairB].map((entry) => ({
    ...entry,
    queueType: "normal" as const,
    pairGroupId: null,
    bracketSource: source,
  }));
}

export function startGame(state: EngineState): EngineCourt {
  const normals = state.queue.filter((entry) => entry.queueType === "normal");
  if (normals.length < 14) {
    throw new Error("Win Lose Bracket requires at least 14 queued players.");
  }
  ensureEvenQueue(normals);
  if (normals.length < 4) {
    throw new Error("Not enough queued players. At least 4 players are required.");
  }

  let selected = normals.slice(0, 4);
  if (isImmediateRepeat(state, selected) && normals.length >= 6) {
    // Soft anti-repeat: rotate one pair from the next two when possible.
    selected = [normals[0], normals[1], normals[4], normals[5]];
  }

  state.queue = removeByIds(
    state.queue,
    selected.map((entry) => entry.id),
  );
  pushRecentFoursome(state, selected);

  return {
    id: `court-${Date.now()}`,
    teamA: [selected[0], selected[1]],
    teamB: [selected[2], selected[3]],
  };
}

function maybeCompleteDeckWithIncomingPair(
  state: EngineState,
  deck: EngineDeck,
  incomingPair: [EngineQueueEntry, EngineQueueEntry],
  source: BracketSource,
) {
  if (!deck.pair) {
    deck.pair = incomingPair;
    return;
  }

  const completed = toMainQueue(deck.pair, incomingPair, source);
  state.queue = [...state.queue, ...completed];
  deck.pair = undefined;
}

export function processWinnerDeck(
  state: EngineState,
  winners?: [EngineQueueEntry, EngineQueueEntry],
) {
  if (winners) {
    maybeCompleteDeckWithIncomingPair(state, state.winnerDeck, winners, "winner_bracket");
  }
}

export function processLoserDeck(state: EngineState, losers?: [EngineQueueEntry, EngineQueueEntry]) {
  if (losers) {
    maybeCompleteDeckWithIncomingPair(state, state.loserDeck, losers, "loser_bracket");
  }
}

export function handleUnpairedPlayers(state: EngineState) {
  const normals = state.queue.filter((entry) => entry.queueType === "normal");
  if (normals.length !== 2) return;

  if (state.winnerDeck.pair) {
    const completed = toMainQueue(state.winnerDeck.pair, [normals[0], normals[1]], "winner_bracket");
    state.queue = [...removeByIds(state.queue, [normals[0].id, normals[1].id]), ...completed];
    state.winnerDeck.pair = undefined;
    return;
  }

  if (state.loserDeck.pair) {
    const completed = toMainQueue(state.loserDeck.pair, [normals[0], normals[1]], "loser_bracket");
    state.queue = [...removeByIds(state.queue, [normals[0].id, normals[1].id]), ...completed];
    state.loserDeck.pair = undefined;
  }
}

export function endGame(state: EngineState, result: CourtResult) {
  processWinnerDeck(state, result.winners);
  processLoserDeck(state, result.losers);
  handleUnpairedPlayers(state);
  ensureEvenQueue(state.queue.filter((entry) => entry.queueType === "normal"));
}

export function assignCourts(state: EngineState, count: number): EngineCourt[] {
  const courts: EngineCourt[] = [];
  for (let i = 0; i < count; i += 1) {
    const normals = state.queue.filter((entry) => entry.queueType === "normal");
    if (normals.length < 4) break;
    courts.push(startGame(state));
  }
  return courts;
}
