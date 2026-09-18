"use client";

import { WatchDemoButton } from "@/components/watch-demo-button";

export function MarketingLandingWatchDemo() {
  return (
    <div className="marketing-landing__watch-demo flex flex-wrap justify-center gap-4 pt-2 text-sm sm:hidden">
      <WatchDemoButton className="border-[var(--marketing-line)] bg-white text-[var(--marketing-ink)] hover:bg-[var(--marketing-foam)]" />
    </div>
  );
}
