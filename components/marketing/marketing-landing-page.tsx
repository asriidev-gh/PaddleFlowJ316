import {
  BarChart3,
  LayoutGrid,
  QrCode,
  Shuffle,
  Users,
} from "lucide-react";

import { DeveloperCreditLink } from "@/components/developer-credit-link";
import { LandingDevicePreview } from "@/components/marketing/landing-device-preview";
import { LandingLiveStats } from "@/components/marketing/landing-live-stats";
import { MarketingLandingTheme } from "@/components/marketing/marketing-landing-theme";
import { MarketingLandingWatchDemo } from "@/components/marketing/marketing-landing-watch-demo";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/app-config";
import { cn } from "@/lib/utils";

const PAIN_POINTS = [
  {
    side: "organizer" as const,
    title: "On the organizer side",
    items: [
      "Players ask “who’s up next?” every few minutes while you’re trying to run courts",
      "Paper lists and group chats drift out of sync when someone checks out early",
      "Pairing the same foursome again and again because there’s no match history at hand",
      "No shared leaderboard — winners and court order turn into debates",
    ],
  },
  {
    side: "player" as const,
    title: "On the player side",
    items: [
      "Unclear wait time and no visibility into who’s on deck",
      "Registration at the door slows down the first games of the night",
      "Hard to track personal stats across a busy open-play session",
      "Spectators can’t follow court action without hovering at the tablet",
    ],
  },
];

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Live queue & courts",
    description:
      "See who’s waiting, who’s on court, and which courts are open — all on one tablet-friendly dashboard.",
  },
  {
    icon: Shuffle,
    title: "Smart court matchups",
    description:
      "Balance partners, spot repeat matchups, and shuffle or swap players in before you fill the next court.",
  },
  {
    icon: QrCode,
    title: "QR player check-in",
    description:
      "New and returning players join the queue in seconds. Volunteers can help without learning a complex system.",
  },
  {
    icon: BarChart3,
    title: "Leaderboards & history",
    description:
      "Session standings, match history, and spectator views keep everyone aligned without shouting across courts.",
  },
];

const marketingLinkClass = (
  variant: "ghost" | "default" | "outline",
  size: "sm" | "default" | "lg",
  extra?: string,
) => cn(buttonVariants({ variant, size }), "font-semibold", extra);

export function MarketingLandingPage() {
  return (
    <>
      <MarketingLandingTheme />
      <div className="marketing-landing">
        <header className="marketing-landing__nav relative z-20">
          <div className="marketing-landing__container marketing-landing__nav-inner">
            <img
              src="/assets/images/paddlestacks_logo.png"
              alt={APP_NAME}
              className="marketing-landing__brand-logo"
            />
            <nav className="marketing-landing__nav-actions relative z-20 flex items-center gap-2 sm:gap-3">
              <a
                href="/signup?saveQuickPlay=1&tab=existing"
                className={marketingLinkClass(
                  "ghost",
                  "default",
                  "marketing-landing__nav-cta text-emerald-950 hover:bg-emerald-100/80",
                )}
              >
                Sign in
              </a>
              <a
                href="/signup?saveQuickPlay=1"
                className={marketingLinkClass(
                  "default",
                  "default",
                  "marketing-landing__nav-cta bg-emerald-600 text-white hover:bg-emerald-700",
                )}
              >
                Get started
              </a>
            </nav>
          </div>
        </header>

        <main>
          <section className="marketing-landing__hero">
            <div className="marketing-landing__container grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
              <div className="relative z-10 space-y-6">
                <p className="marketing-landing__eyebrow">Open play queue manager</p>
                <h1 className="marketing-landing__headline">
                  Simpler court rotation for busy pickleball nights
                </h1>
                <p className="marketing-landing__lead">
                  {APP_NAME} keeps your queue, courts, and player check-in in one place — so you
                  spend less time coordinating and more time on the courts.
                </p>
                <div className="relative z-20 flex flex-wrap gap-3">
                  <a
                    href="/play"
                    className={marketingLinkClass("default", "lg", "bg-emerald-600 text-white hover:bg-emerald-700")}
                  >
                    Start free session, try without account!
                  </a>
                </div>
                <p className="text-sm text-emerald-900/70">
                  No install required — runs in the browser on your tablet or laptop.
                </p>
                <MarketingLandingWatchDemo />
              </div>

              <LandingDevicePreview className="mx-auto w-full max-w-2xl lg:max-w-none" />
            </div>
          </section>

          <LandingLiveStats />

          <section className="marketing-landing__section marketing-landing__section--muted">
            <div className="marketing-landing__container space-y-10">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="marketing-landing__section-title">Does this sound familiar?</h2>
                <p className="marketing-landing__section-lead">
                  Open play grows fast. Spreadsheets and whiteboards rarely keep up when courts turn
                  over every fifteen minutes.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {PAIN_POINTS.map((group) => (
                  <article key={group.side} className="marketing-landing__card space-y-4">
                    <h3 className="text-lg font-semibold text-emerald-950">{group.title}</h3>
                    <ul className="space-y-3 text-sm leading-relaxed text-emerald-900/85">
                      {group.items.map((item) => (
                        <li key={item} className="flex gap-2.5">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="how-it-works" className="marketing-landing__section">
            <div className="marketing-landing__container space-y-10">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="marketing-landing__section-title">How {APP_NAME} works</h2>
                <p className="marketing-landing__section-lead">
                  Built for recreation centers, church gyms, and club open play — intuitive enough for
                  volunteers, powerful enough for weekly operators.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {FEATURES.map((feature) => (
                  <article key={feature.title} className="marketing-landing__card flex gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <feature.icon className="size-5" aria-hidden />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-emerald-950">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-emerald-900/80">{feature.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="marketing-landing__section marketing-landing__section--accent">
            <div className="marketing-landing__container grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-4">
                <h2 className="marketing-landing__section-title text-white">
                  Calmer courts, happier players
                </h2>
                <p className="max-w-2xl text-base leading-relaxed text-emerald-50/90">
                  Run your next open play with a clear queue, fair rotations, and a leaderboard
                  everyone can trust. Sign in to save multiple sessions, or jump in with a quick
                  browser session tonight.
                </p>
                <blockquote className="border-l-2 border-amber-300/80 pl-4 text-sm italic text-emerald-50/85">
                  “We stopped arguing about who’s up next. The tablet shows the queue and the
                  leaderboard just works.”
                </blockquote>
              </div>
              <div className="relative z-20 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href="/signup?saveQuickPlay=1"
                  className={marketingLinkClass(
                    "default",
                    "lg",
                    "bg-white text-emerald-800 hover:bg-emerald-50",
                  )}
                >
                  Create free account
                </a>
                <a
                  href="/play"
                  className={marketingLinkClass(
                    "outline",
                    "lg",
                    "border-white/40 bg-transparent text-white hover:bg-white/10",
                  )}
                >
                  <Users className="size-4" aria-hidden />
                  Quick play
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer className="marketing-landing__footer">
          <div className="marketing-landing__container flex flex-col items-center justify-between gap-3 py-8 text-center text-sm text-emerald-900/70 sm:flex-row sm:text-left">
            <p suppressHydrationWarning>
              © {new Date().getFullYear()} {APP_NAME}. Open-play queue & court flow.
            </p>
            <DeveloperCreditLink marketingLight />
          </div>
        </footer>
      </div>
    </>
  );
}
