export type CommunityStandingRow = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  pickleballLevel: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  sessionsPlayed: number;
  undefeatedSessions: number;
  mvpSessions: number;
};

export type CommunityPartnerPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
};

/** Two players' combined record when they played the same side of a doubles match. */
export type CommunityPartnerPair = {
  id: string;
  players: [CommunityPartnerPlayer, CommunityPartnerPlayer];
  gamesTogether: number;
  wins: number;
  losses: number;
  winRate: number;
};

export type CommunityStandings = {
  clubName: string;
  available: boolean;
  totals: { players: number; sessions: number; gamesPlayed: number };
  rows: CommunityStandingRow[];
  partners: CommunityPartnerPair[];
};

const REVALIDATE_SECONDS = 300; // standings change after every game, so keep this shorter than the roster

/**
 * Loads the club-wide all-time standings from the CCF Pickleball app (GET /api/standings,
 * which needs no key). Server-only; cached so visits do not call the API every time.
 * Returns null when the API is not configured or cannot be reached.
 *
 * Env: COMMUNITY_API_URL, the base URL of the CCF app.
 */
export async function fetchCommunityStandings(): Promise<CommunityStandings | null> {
  const baseUrl = process.env.COMMUNITY_API_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/api/standings`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;

    const body = (await response.json()) as Partial<CommunityStandings>;
    if (!Array.isArray(body.rows)) return null;

    return {
      clubName: body.clubName ?? "",
      available: body.available !== false,
      totals: body.totals ?? { players: body.rows.length, sessions: 0, gamesPlayed: 0 },
      rows: body.rows,
      partners: Array.isArray(body.partners) ? body.partners : [],
    };
  } catch {
    return null;
  }
}
