export type CommunityPlayer = {
  id: string;
  name: string;
  photoUrl: string;
};

type CommunityPlayersResponse = {
  data?: CommunityPlayer[];
  pagination?: { hasNextPage?: boolean };
};

const PAGE_SIZE = 100; // the API's maximum
const MAX_PAGES = 20; // safety stop
const REVALIDATE_SECONDS = 3600; // each page is served from Next's data cache for an hour

/**
 * Loads the whole public player directory from the CCF Pickleball API
 * (GET /api/public/players), following pagination. Server-only: the API key must never
 * reach the browser. Each page request is cached, so the API is hit at most once per
 * page per REVALIDATE_SECONDS rather than on every visit.
 *
 * Env:
 *   COMMUNITY_API_URL  base URL of the CCF app, e.g. https://ccf.example.com
 *   COMMUNITY_API_KEY  one of that app's PUBLIC_API_KEYS
 *
 * Returns whatever was loaded (possibly nothing) on failure so the landing page can hide the section.
 */
export async function fetchCommunityPlayers(): Promise<CommunityPlayer[]> {
  const baseUrl = process.env.COMMUNITY_API_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.COMMUNITY_API_KEY?.trim();
  if (!baseUrl || !apiKey) return [];

  const players: CommunityPlayer[] = [];

  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await fetch(
        `${baseUrl}/api/public/players?page=${page}&pageSize=${PAGE_SIZE}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          next: { revalidate: REVALIDATE_SECONDS },
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (!response.ok) break;

      const body = (await response.json()) as CommunityPlayersResponse;
      if (Array.isArray(body.data)) {
        players.push(...body.data.filter((player) => player.name && player.photoUrl));
      }
      if (!body.pagination?.hasNextPage) break;
    }
  } catch {
    // keep any pages already loaded
  }

  return players;
}
