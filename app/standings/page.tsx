import type { Metadata } from "next";
import { ArrowLeft, Trophy } from "lucide-react";

import { CommunityStandingsView } from "@/components/marketing/community-standings-view";
import { MarketingLandingTheme } from "@/components/marketing/marketing-landing-theme";
import { APP_NAME } from "@/lib/app-config";
import { fetchCommunityStandings } from "@/lib/community-standings";

export const metadata: Metadata = {
  title: `All-time Leaderboard — ${APP_NAME}`,
  description: "Every player ranked across all open play sessions, best record first.",
};

export default async function StandingsPage() {
  const standings = await fetchCommunityStandings();
  const ready = standings?.available && standings.rows.length > 0;

  return (
    <>
      <MarketingLandingTheme />
      <div className="marketing-landing">
        <main className="marketing-landing__container standings-page">
          <header className="standings-page__header">
            <span className="standings-page__icon" aria-hidden>
              <Trophy className="size-5" />
            </span>
            <div>
              <h1 className="marketing-landing__section-title">All-time Leaderboard</h1>
              <p className="marketing-landing__section-lead">
                Every player ranked across all open play sessions, best record first.
              </p>
            </div>
          </header>

          {ready ? (
            <>
              <p className="standings-page__totals">
                {standings.totals.players} players · {standings.totals.sessions} sessions ·{" "}
                {standings.totals.gamesPlayed} games
              </p>
              <CommunityStandingsView standings={standings} />
            </>
          ) : (
            <p className="standings-empty">
              {standings
                ? "Standings are not published yet."
                : "Standings are unavailable right now. Please try again shortly."}
            </p>
          )}

          <a href="/" className="standings-page__back">
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </a>
        </main>
      </div>
    </>
  );
}
