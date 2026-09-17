import {
  BarChart3,
  LayoutGrid,
  QrCode,
  Shuffle,
  Trophy,
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

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
] as const;

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Live queue & courts",
    description:
      "See who’s waiting, who’s on court, and which courts are open — one tablet-friendly dashboard for the whole gym.",
  },
  {
    icon: Shuffle,
    title: "Smart matchups",
    description:
      "Balance partners, spot repeat foursomes, and shuffle or swap players before you fill the next court.",
  },
  {
    icon: QrCode,
    title: "QR player check-in",
    description:
      "New and returning players join in seconds. Volunteers help without learning a complex system.",
  },
  {
    icon: BarChart3,
    title: "Leaderboards & history",
    description:
      "Session standings and match history keep everyone aligned — no debates about who won or who’s up next.",
  },
  {
    icon: Trophy,
    title: "Built for open play",
    description:
      "Recreation centers, church gyms, and clubs get calm rotations without spreadsheets or shouting across courts.",
  },
] as const;

const STEPS = [
  {
    step: "1",
    title: "Open",
    description: `Start a session in the browser on your tablet or laptop. No app install — ${APP_NAME} is ready when players walk in.`,
  },
  {
    step: "2",
    title: "Queue",
    description:
      "Players check in with QR or name. The live queue shows who’s waiting and which courts are free.",
  },
  {
    step: "3",
    title: "Play",
    description:
      "Fill courts, shuffle fair matchups, and keep the leaderboard honest while you stay on the floor.",
  },
] as const;

const REVIEWS = [
  {
    quote:
      "We stopped arguing about who’s up next. The tablet shows the queue and the leaderboard just works.",
    name: "Marcus T.",
    detail: "Club open play · 6 courts",
  },
  {
    quote:
      "Volunteers figured it out in one night. QR check-in cut the door line in half.",
    name: "Priya S.",
    detail: "Recreation center",
  },
  {
    quote:
      "I used to run rotations from a whiteboard. Now courts turn over clean and players actually trust the order.",
    name: "Derek L.",
    detail: "Church gym nights",
  },
  {
    quote:
      "Spectators follow the leaderboard on their phones. I can stay courtside instead of answering the same question fifty times.",
    name: "Elena R.",
    detail: "Weekly drop-in",
  },
  {
    quote:
      "Finally something built for pickleball open play — not a generic tournament tool with a queue bolted on.",
    name: "Jordan K.",
    detail: "Facility manager",
  },
  {
    quote:
      "Quick play got us running the same night. We signed up later when we wanted saved sessions.",
    name: "Aisha M.",
    detail: "Community club",
  },
] as const;

const FAQS = [
  {
    question: `Is ${APP_NAME} free?`,
    answer:
      "Yes. You can run open play in the browser for free with Quick Play, or create an account to save sessions and manage multiple games.",
  },
  {
    question: "Do I need to install an app?",
    answer:
      "No. It runs in the browser on your tablet, laptop, or phone — ideal for a courtside operator station.",
  },
  {
    question: "Who is it for?",
    answer:
      "Organizers running recreation open play, club nights, and church gym sessions who need a live queue, fair rotations, and a shared leaderboard.",
  },
  {
    question: "Can players check themselves in?",
    answer:
      "Yes. Players can join with QR check-in or you can add them from the operator view. Either way, the queue stays in sync.",
  },
  {
    question: "Does it work for singles and doubles?",
    answer:
      "Yes. Court layouts and matchups support common open-play formats so you can keep rotations moving.",
  },
] as const;

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
        <a href="#main" className="marketing-landing__skip">
          Skip to content
        </a>

        <header className="marketing-landing__nav relative z-20">
          <div className="marketing-landing__container marketing-landing__nav-inner">
            <a href="/" className="marketing-landing__brand-link" aria-label={`${APP_NAME} home`}>
              <img
                src="/assets/images/paddlestacks_logo.png"
                alt={APP_NAME}
                className="marketing-landing__brand-logo"
              />
            </a>

            <nav className="marketing-landing__nav-links" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="marketing-landing__nav-link">
                  {link.label}
                </a>
              ))}
            </nav>

            <nav className="marketing-landing__nav-actions relative z-20 flex items-center gap-2 sm:gap-3">
              <a
                href="/signup?saveQuickPlay=1&tab=existing"
                className={marketingLinkClass(
                  "ghost",
                  "default",
                  "marketing-landing__nav-cta marketing-landing__nav-cta--ghost",
                )}
              >
                Sign in
              </a>
              <a
                href="/signup?saveQuickPlay=1"
                className={marketingLinkClass(
                  "default",
                  "default",
                  "marketing-landing__nav-cta marketing-landing__nav-cta--solid",
                )}
              >
                Get started
              </a>
            </nav>
          </div>
        </header>

        <main id="main">
          <section className="marketing-landing__hero">
            <div className="marketing-landing__container marketing-landing__hero-inner">
              <p className="marketing-landing__eyebrow">Open play · Queue · Courts</p>
              <h1 className="marketing-landing__headline">
                Less queue chaos.
                <span className="marketing-landing__headline-accent"> More time on court.</span>
              </h1>
              <p className="marketing-landing__lead marketing-landing__lead--center">
                {APP_NAME} turns open play into a calm rotation — live queue, fair matchups, QR
                check-in, and a leaderboard everyone can trust. No spreadsheets. No whiteboard
                arguments.
              </p>
              <div className="marketing-landing__hero-actions relative z-20">
                <a
                  href="/play"
                  className={marketingLinkClass(
                    "default",
                    "lg",
                    "marketing-landing__cta-primary",
                  )}
                >
                  Start free — no install
                </a>
                <a
                  href="/signup?saveQuickPlay=1"
                  className={marketingLinkClass(
                    "outline",
                    "lg",
                    "marketing-landing__cta-secondary",
                  )}
                >
                  Create account
                </a>
              </div>
              <p className="marketing-landing__hero-proof">
                Free in the browser · Tablet-ready · Built for pickleball open play
              </p>
              <MarketingLandingWatchDemo />
            </div>

            <div className="marketing-landing__container marketing-landing__hero-preview">
              <LandingDevicePreview className="mx-auto w-full max-w-3xl" />
            </div>
          </section>

          <LandingLiveStats />

          <section id="features" className="marketing-landing__section">
            <div className="marketing-landing__container space-y-12">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="marketing-landing__section-title">
                  Run open play in the time it takes to call “ball on.”
                </h2>
                <p className="marketing-landing__section-lead">
                  Every other system makes you do the coordinating. {APP_NAME} keeps the queue
                  honest, then gets out of the way.
                </p>
              </div>

              <div className="marketing-landing__feature-grid">
                {FEATURES.map((feature) => (
                  <article key={feature.title} className="marketing-landing__feature-card">
                    <div className="marketing-landing__feature-icon" aria-hidden>
                      <feature.icon className="size-5" />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="how-it-works" className="marketing-landing__section marketing-landing__section--muted">
            <div className="marketing-landing__container space-y-12">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="marketing-landing__section-title">
                  From door to first game in three steps.
                </h2>
              </div>
              <ol className="marketing-landing__steps">
                {STEPS.map((step) => (
                  <li key={step.step} className="marketing-landing__step">
                    <span className="marketing-landing__step-num" aria-hidden>
                      {step.step}
                    </span>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section id="reviews" className="marketing-landing__section">
            <div className="marketing-landing__container space-y-12">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="marketing-landing__section-title">
                  Organizers who used to chase whiteboards.
                </h2>
                <p className="marketing-landing__section-lead marketing-landing__section-lead--punch">
                  Now they don’t.
                </p>
              </div>
              <div className="marketing-landing__reviews">
                {REVIEWS.map((review) => (
                  <figure key={review.name} className="marketing-landing__review">
                    <div className="marketing-landing__stars" aria-label="5 out of 5 stars">
                      ★★★★★
                    </div>
                    <blockquote>“{review.quote}”</blockquote>
                    <figcaption>
                      <span className="marketing-landing__review-name">{review.name}</span>
                      <span className="marketing-landing__review-detail">{review.detail}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>

          <section id="faq" className="marketing-landing__section marketing-landing__section--muted">
            <div className="marketing-landing__container marketing-landing__faq-wrap">
              <h2 className="marketing-landing__section-title text-center">Questions, answered.</h2>
              <div className="marketing-landing__faq">
                {FAQS.map((item) => (
                  <details key={item.question} className="marketing-landing__faq-item">
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="marketing-landing__section marketing-landing__section--accent">
            <div className="marketing-landing__container marketing-landing__cta-band">
              <div className="space-y-4 text-center sm:text-left">
                <h2 className="marketing-landing__section-title text-white">
                  Spend your night playing, not policing the queue.
                </h2>
                <p className="marketing-landing__cta-band-lead">
                  Start a free session in under a minute — or create an account to save every open
                  play night.
                </p>
              </div>
              <div className="relative z-20 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-end">
                <a
                  href="/play"
                  className={marketingLinkClass(
                    "default",
                    "lg",
                    "bg-white text-[var(--marketing-ink)] hover:bg-[var(--marketing-foam)]",
                  )}
                >
                  <Users className="size-4" aria-hidden />
                  Quick play
                </a>
                <a
                  href="/signup?saveQuickPlay=1"
                  className={marketingLinkClass(
                    "outline",
                    "lg",
                    "border-white/35 bg-transparent text-white hover:bg-white/10",
                  )}
                >
                  Create free account
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer className="marketing-landing__footer">
          <div className="marketing-landing__container marketing-landing__footer-inner">
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
