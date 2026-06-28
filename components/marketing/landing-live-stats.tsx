import {
  formatMarketingStat,
  generateMarketingLiveStats,
} from "@/lib/marketing-live-stats";

const STAT_ITEMS = [
  { key: "sessionsRun" as const, label: "Sessions Run" },
  { key: "playersManaged" as const, label: "Players Managed" },
  { key: "clubs" as const, label: "Clubs" },
];

export function LandingLiveStats() {
  const stats = generateMarketingLiveStats();

  return (
    <section className="marketing-live-stats" aria-label="Platform activity">
      <div className="marketing-landing__container">
        <div className="marketing-live-stats__banner">
          <p className="marketing-live-stats__live">
            <span className="marketing-live-stats__pulse" aria-hidden />
            <span>
              <strong>{formatMarketingStat(stats.activeSessions)}</strong> sessions active now
            </span>
          </p>
          <p className="marketing-live-stats__tagline">Already used for real open play</p>
        </div>

        <div className="marketing-live-stats__grid">
          {STAT_ITEMS.map((item) => (
            <div key={item.key} className="marketing-live-stats__item">
              <p className="marketing-live-stats__value">{formatMarketingStat(stats[item.key])}</p>
              <p className="marketing-live-stats__label">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
