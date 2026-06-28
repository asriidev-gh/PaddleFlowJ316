"use client";

import { Crown, Sparkles } from "lucide-react";
import Link from "next/link";

import { PremiumBadge } from "@/components/home/premium-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPremiumAnnualPrice } from "@/lib/premium-payment-shared";

export function PremiumUpsellCard() {
  const annualPrice = formatPremiumAnnualPrice();

  return (
    <Card className="premium-upsell-card glass-panel border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200"
            aria-hidden
          >
            <Crown className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Upgrade to Premium</p>
              <PremiumBadge />
              <span className="text-xs font-semibold tabular-nums text-amber-800 dark:text-amber-200">
                {annualPrice}/yr
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Run live queueing open play with QR check-in, spectator views, session history, and more.
            </p>
          </div>
        </div>
        <Button
          className="w-full shrink-0 gap-2 sm:w-auto"
          nativeButton={false}
          render={<Link href="/premium" />}
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Request premium access
        </Button>
      </CardContent>
    </Card>
  );
}
