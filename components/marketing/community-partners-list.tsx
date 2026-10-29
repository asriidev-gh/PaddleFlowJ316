"use client";

import { Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { CommunityPhotoButton } from "@/components/marketing/community-photo-button";
import type { CommunityPartnerPair, CommunityPartnerPlayer } from "@/lib/community-standings";
import { formatPlayerTableName } from "@/lib/utils";

const PAGE_SIZE = 50;
/** A pair must have partnered more than 3 times to be ranked (matches the CCF app). */
const MIN_PARTNER_GAMES = 4;

type SortMode = "winRate" | "games";

const SORTS: Array<{ value: SortMode; label: string }> = [
  { value: "winRate", label: "Best win rate" },
  { value: "games", label: "Most games together" },
];

function initialsOf(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function PartnerAvatar({ player }: { player: CommunityPartnerPlayer }) {
  const name = formatPlayerTableName(player.firstName, player.lastName);
  return (
    <CommunityPhotoButton name={name} photoUrl={player.photoUrl}>
      {player.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={player.photoUrl} alt="" loading="lazy" className="standings-row__avatar standings-row__avatar--pair" />
      ) : (
        <span className="standings-row__avatar standings-row__avatar--pair standings-row__avatar--empty" aria-hidden>
          {initialsOf(name)}
        </span>
      )}
    </CommunityPhotoButton>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="standings-row__stat">
      <span className="standings-row__stat-value">{value}</span>
      <span className="standings-row__stat-label">{label}</span>
    </div>
  );
}

/** Doubles pairs ranked by how they do together. */
export function CommunityPartnersList({ pairs }: { pairs: CommunityPartnerPair[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("winRate");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const ranked = useMemo(() => {
    const sorted = [...pairs].sort((a, b) =>
      sort === "games"
        ? b.gamesTogether - a.gamesTogether || b.winRate - a.winRate || b.wins - a.wins
        : b.winRate - a.winRate || b.gamesTogether - a.gamesTogether || b.wins - a.wins,
    );
    return sorted.map((pair, index) => ({ pair, rank: index + 1 }));
  }, [pairs, sort]);

  // Search only looks a pair up, so it keeps the rank it holds in the current sort.
  const matches = useMemo(() => {
    if (!deferredQuery) return ranked;
    return ranked.filter(({ pair }) =>
      pair.players.some((player) =>
        formatPlayerTableName(player.firstName, player.lastName).toLowerCase().includes(deferredQuery),
      ),
    );
  }, [ranked, deferredQuery]);

  if (pairs.length === 0) {
    return (
      <p className="standings-empty">
        No partner stats yet. Pairs show up once they&apos;ve played more than {MIN_PARTNER_GAMES - 1}{" "}
        doubles games together and won at least once.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="standings-toolbar">
        <label className="standings-search">
          <Search className="size-4" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Search a player"
            aria-label="Search a player"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </label>

        <div className="standings-segmented" role="group" aria-label="Sort partners">
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={sort === option.value}
              onClick={() => {
                setSort(option.value);
                setLimit(PAGE_SIZE);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="standings-hint">
        Pairs with more than {MIN_PARTNER_GAMES - 1} doubles games together and at least one win.
      </p>

      {matches.length === 0 ? (
        <p className="standings-empty">No pair matches “{query.trim()}”.</p>
      ) : (
        <ol className="standings-list">
          {matches.slice(0, limit).map(({ pair, rank }) => {
            const [first, second] = pair.players;
            return (
              <li
                key={pair.id}
                className={`standings-row${rank <= 3 ? ` standings-row--podium standings-row--rank${rank}` : ""}`}
              >
                <span className="standings-row__rank">{rank}</span>
                <div className="standings-row__pair">
                  <PartnerAvatar player={first} />
                  <PartnerAvatar player={second} />
                </div>
                <div className="standings-row__identity">
                  <p className="standings-row__name">
                    {formatPlayerTableName(first.firstName, first.lastName)} &amp;{" "}
                    {formatPlayerTableName(second.firstName, second.lastName)}
                  </p>
                  <p className="standings-row__meta">{pair.gamesTogether} games together</p>
                </div>
                <div className="standings-row__stats standings-row__stats--four">
                  <Stat label="Win %" value={`${pair.winRate}%`} />
                  <Stat label="Won" value={String(pair.wins)} />
                  <Stat label="Lost" value={String(pair.losses)} />
                  <Stat label="Games" value={String(pair.gamesTogether)} />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {limit < matches.length ? (
        <button type="button" className="standings-more" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
          Show next {Math.min(PAGE_SIZE, matches.length - limit)}
        </button>
      ) : null}
    </div>
  );
}
