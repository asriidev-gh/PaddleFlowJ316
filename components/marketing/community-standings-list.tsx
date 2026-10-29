"use client";

import { Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { CommunityPhotoButton } from "@/components/marketing/community-photo-button";
import type { CommunityStandingRow } from "@/lib/community-standings";
import { formatPlayerTableName } from "@/lib/utils";

/** Rows drawn per step: drawing a whole long board at once is slow. */
const PAGE_SIZE = 50;

function initialsOf(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="standings-row__stat">
      <span className="standings-row__stat-value">{value}</span>
      <span className="standings-row__stat-label">{label}</span>
    </div>
  );
}

export function CommunityStandingsList({ rows }: { rows: CommunityStandingRow[] }) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  // Rank comes from the full board, so a search does not renumber the players it finds.
  const ranked = useMemo(
    () =>
      rows.map((row, index) => ({
        row,
        rank: index + 1,
        name: formatPlayerTableName(row.firstName, row.lastName),
      })),
    [rows],
  );

  const matches = useMemo(
    () => (deferredQuery ? ranked.filter((item) => item.name.toLowerCase().includes(deferredQuery)) : ranked),
    [ranked, deferredQuery],
  );

  return (
    <div className="space-y-4">
      <label className="standings-search">
        <Search className="size-4" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder="Search players"
          aria-label="Search players"
        />
        {query ? (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </label>

      {matches.length === 0 ? (
        <p className="standings-empty">No players match “{query.trim()}”.</p>
      ) : (
        <ol className="standings-list">
          {matches.slice(0, visible).map(({ row, rank, name }) => (
            <li
              key={row.id}
              className={`standings-row${rank <= 3 ? ` standings-row--podium standings-row--rank${rank}` : ""}`}
            >
              <span className="standings-row__rank">{rank}</span>
              <CommunityPhotoButton name={name} photoUrl={row.photoUrl}>
                {row.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.photoUrl} alt="" loading="lazy" className="standings-row__avatar" />
                ) : (
                  <span className="standings-row__avatar standings-row__avatar--empty" aria-hidden>
                    {initialsOf(name)}
                  </span>
                )}
              </CommunityPhotoButton>
              <div className="standings-row__identity">
                <p className="standings-row__name">{name}</p>
                <p className="standings-row__meta">
                  {row.sessionsPlayed} {row.sessionsPlayed === 1 ? "session" : "sessions"}
                </p>
              </div>
              <div className="standings-row__stats">
                <Stat label="Won" value={String(row.wins)} />
                <Stat label="Lost" value={String(row.losses)} />
                <Stat label="Games" value={String(row.gamesPlayed)} />
                <Stat label="Win %" value={`${row.winRate}%`} />
                <Stat label="Undefeated" value={String(row.undefeatedSessions)} />
                <Stat label="MVP" value={String(row.mvpSessions)} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {matches.length > visible ? (
        <button type="button" className="standings-more" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
          Show more ({matches.length - visible} left)
        </button>
      ) : null}
    </div>
  );
}
