import type { OFFLINE_SNAPSHOT_VERSION } from "@/lib/offline-game/config";

export type OfflinePlayerRecord = {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  personalQrCode?: string;
};

export type OfflineQueueEntry = {
  _id: string;
  gameId: string;
  playerId: string;
  status: "queued" | "on_court" | "done" | "checked_out";
  queueType: "normal" | "winner" | "loser";
  pairGroupId: string | null;
  deckPlacement: "deck" | "open_court" | null;
  openCourtGroupId: string | null;
  openCourtTeam: "A" | "B" | null;
  registeredAt: string;
  winStreak: number;
  lastMatchResult: "win" | "loss" | "none";
  createdAt?: string;
  updatedAt?: string;
};

export type OfflineCourtTeam = {
  playerIds: string[];
  queueEntryIds: string[];
};

export type OfflineCourt = {
  _id: string;
  gameId: string;
  courtNumber: number;
  status: "empty" | "active";
  teamA: OfflineCourtTeam;
  teamB: OfflineCourtTeam;
  startedAt: string | null;
  isRematch: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OfflineMatch = {
  _id: string;
  gameId: string;
  courtNumber: number;
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
  winnerTeam: "A" | "B";
  loserTeam: "A" | "B";
  teamAScore: number | null;
  teamBScore: number | null;
  startedAt: string | null;
  endedAt: string;
  durationSeconds: number;
  createdAt?: string;
  updatedAt?: string;
};

export type OfflineLeaderboardStat = {
  _id: string;
  gameId: string;
  playerId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  createdAt?: string;
  updatedAt?: string;
};

export type OfflineGameRecord = {
  _id: string;
  title: string;
  gameId: string;
  ownerId: string;
  openPlayType: string;
  openPlayDate?: string | null;
  openPlayTimeRange?: string | null;
  courtCount: number;
  expectedPlayers: number;
  strictPlayerCount: boolean;
  allowQrRegistration: boolean;
  registrationMode?: "self" | "owner";
  registerUrl?: string;
  publicQrCodeDataUrl?: string;
  status: "draft" | "active" | "ended";
};

export type OfflineClubBranding = {
  clubName?: string | null;
  clubLogoUrl?: string | null;
  ownerName?: string | null;
};

export type OfflineGameSnapshot = {
  version: number;
  gameId: string;
  ownerId: string;
  savedAt: string;
  offlineSince?: string;
  game: OfflineGameRecord;
  clubBranding: OfflineClubBranding | null;
  courts: OfflineCourt[];
  queueEntries: OfflineQueueEntry[];
  matches: OfflineMatch[];
  leaderboardStats: OfflineLeaderboardStat[];
  players: Record<string, OfflinePlayerRecord>;
};

export type OfflineRegistry = {
  games: Record<
    string,
    {
      ownerId: string;
      enteredAt: string;
      lastSavedAt: string;
    }
  >;
};

export type OfflineModeStatus = {
  enabled: boolean;
  offline: boolean;
  savedAt?: string;
  offlineSince?: string;
  pendingSync: boolean;
  snapshotExists: boolean;
  autoFallback: boolean;
};
