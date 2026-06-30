"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

import { PremiumBadge } from "@/components/home/premium-badge";
import { PremiumUpgradeRequestDialog } from "@/components/premium/premium-upgrade-request-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthMe } from "@/hooks/use-auth-me";
import { usePrefetchPremiumUpgradeRequest } from "@/hooks/use-prefetch-premium-upgrade-request";
import { FREE_TIER_HIGHLIGHTS, PREMIUM_FEATURES } from "@/lib/premium-features";
import { canUseLiveQueueing } from "@/lib/premium-access";
import { formatPremiumAnnualPrice } from "@/lib/premium-payment-shared";
import { cn } from "@/lib/utils";

export function PremiumPageContent() {
  const { data: authData } = useAuthMe();
  const hasPremium = canUseLiveQueueing(authData?.user);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const annualPrice = formatPremiumAnnualPrice();
  usePrefetchPremiumUpgradeRequest(!hasPremium);

  return (
    <>
      <div className="premium-page-content space-y-6">
        {hasPremium ? (
          <Card className="glass-panel border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Premium is active on your account</p>
                  <PremiumBadge />
                </div>
                <p className="text-sm text-muted-foreground">
                  You have access to live queueing games and all features below.
                </p>
              </div>
              <Button nativeButton={false} render={<Link href="/my-games" />}>
                Go to My Games
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-panel border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-transparent to-sky-500/5">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Premium — live queueing open play</p>
                  <span className="text-sm font-bold tabular-nums text-amber-800 dark:text-amber-200">
                    {annualPrice}/year
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your account includes Quick Games today. Upgrade for server-backed live sessions,
                  QR check-in, and full session management.
                </p>
              </div>
              <Button className="shrink-0 gap-2" size="lg" onClick={() => setUpgradeDialogOpen(true)}>
                <Sparkles className="h-4 w-4" aria-hidden />
                Request premium access
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="space-y-3" aria-labelledby="premium-features-heading">
          <h2 id="premium-features-heading" className="text-base font-semibold text-foreground">
            What premium includes
          </h2>
          <ul className="premium-feature-grid grid gap-3 sm:grid-cols-2">
            {PREMIUM_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title}>
                  <Card className="glass-panel h-full border-border/70">
                    <CardContent className="flex gap-3 p-4">
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-800 dark:text-amber-200"
                        aria-hidden
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="grid gap-4 lg:grid-cols-2" aria-labelledby="plan-comparison-heading">
          <h2 id="plan-comparison-heading" className="sr-only">
            Free vs premium
          </h2>
          <Card className="glass-panel border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Free — Quick Games</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-sm text-muted-foreground">
                Great for trying the app or running a small session without live queuing on the server.
              </p>
              <ul className="space-y-2">
                {FREE_TIER_HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className={cn("glass-panel border-amber-500/35", hasPremium && "bg-amber-500/5")}>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                Premium — Live queueing
                <PremiumBadge />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{annualPrice} per year.</span> Everything
                in Quick Games, plus full open-play operations for clubs and organizers.
              </p>
              <ul className="space-y-2">
                {PREMIUM_FEATURES.map((feature) => (
                  <li key={feature.title} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
                    {feature.title}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {!hasPremium ? (
          <Card className="glass-panel border-border/70">
            <CardContent className="space-y-3 p-5 text-center sm:text-left">
              <p className="text-sm font-medium text-foreground">How to upgrade</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Tap <span className="font-medium text-foreground">Request premium access</span> above.</li>
                <li>Pay {annualPrice} via GCash using the QR code shown.</li>
                <li>Upload your proof of payment — we&apos;ll validate it and activate Premium on your account.</li>
              </ol>
              <Button className="gap-2" onClick={() => setUpgradeDialogOpen(true)}>
                <Sparkles className="h-4 w-4" aria-hidden />
                Request premium access
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <PremiumUpgradeRequestDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
    </>
  );
}
