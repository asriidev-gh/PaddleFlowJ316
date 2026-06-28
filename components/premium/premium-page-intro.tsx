"use client";

import { Crown } from "lucide-react";

import { PremiumBadge } from "@/components/home/premium-badge";

export function PremiumPageIntro() {
  return (
    <div className="premium-page-intro flex items-start gap-3">
      <span className="premium-page-intro__icon flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-800 dark:text-amber-200">
        <Crown className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="page-title">Premium</h1>
          <PremiumBadge />
        </div>
        <p className="caption mt-0.5 max-w-2xl">
          Unlock live queueing open play for your club — full sessions on the server with QR check-in,
          spectator views, and everything you need to run busy courts.
        </p>
      </div>
    </div>
  );
}
