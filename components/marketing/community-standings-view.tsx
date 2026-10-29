"use client";

import { Handshake, Trophy } from "lucide-react";
import { useState } from "react";

import { CommunityPartnersList } from "@/components/marketing/community-partners-list";
import { CommunityStandingsList } from "@/components/marketing/community-standings-list";
import type { CommunityStandings } from "@/lib/community-standings";

const TABS = [
  { value: "players", label: "Players", Icon: Trophy },
  { value: "partners", label: "Partners", Icon: Handshake },
] as const;

/** Players / Partners switch over the club-wide all-time standings. */
export function CommunityStandingsView({ standings }: { standings: CommunityStandings }) {
  const [view, setView] = useState<(typeof TABS)[number]["value"]>("players");

  return (
    <div className="space-y-5">
      <div className="standings-segmented standings-segmented--tabs" role="tablist" aria-label="Leaderboard view">
        {TABS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            aria-pressed={view === value}
            onClick={() => setView(value)}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {view === "players" ? (
        <CommunityStandingsList rows={standings.rows} />
      ) : (
        <CommunityPartnersList pairs={standings.partners} />
      )}
    </div>
  );
}
