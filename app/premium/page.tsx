"use client";

import { HomeMobileNav } from "@/components/home-mobile-nav";
import { PremiumPageContent } from "@/components/premium/premium-page-content";
import { PremiumPageIntro } from "@/components/premium/premium-page-intro";
import { usePrefetchPremiumUpgradeRequest } from "@/hooks/use-prefetch-premium-upgrade-request";

export default function PremiumPage() {
  usePrefetchPremiumUpgradeRequest();

  return (
    <main className="premium-page min-h-screen px-6 py-6 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:px-10 lg:pb-6">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <PremiumPageIntro />
        <PremiumPageContent />
      </section>
      <HomeMobileNav />
    </main>
  );
}
