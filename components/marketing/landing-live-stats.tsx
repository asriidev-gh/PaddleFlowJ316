import {
  formatMarketingStat,
  generateMarketingLiveStats,
} from "@/lib/marketing-live-stats";

const STAT_ITEMS = [
  { key: "sessionsRun" as const, label: "sessions run" },
  { key: "playersManaged" as const, label: "players managed" },
  { key: "clubs" as const, label: "clubs & gyms" },
  { key: "activeSessions" as const, label: "active right now", live: true },
] as const;

export function LandingLiveStats() {
  const stats = generateMarketingLiveStats();

  return (
    <section className="marketing-live-stats" aria-label="Platform activity">
      <div className="marketing-landing__container">
        <div className="marketing-live-stats__grid">
          {STAT_ITEMS.map((item) => (
            <div key={item.key} className="marketing-live-stats__item">
              <p className="marketing-live-stats__value">
                {"live" in item && item.live ? (
                  <span className="marketing-live-stats__live-value">
                    <span className="marketing-live-stats__pulse" aria-hidden />
                    {formatMarketingStat(stats[item.key])}
                  </span>
                ) : (
                  formatMarketingStat(stats[item.key])
                )}
              </p>
              <p className="marketing-live-stats__label">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
