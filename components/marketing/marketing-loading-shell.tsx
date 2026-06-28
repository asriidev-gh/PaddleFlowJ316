"use client";

import { useMarketingLightTheme } from "@/hooks/use-marketing-light-theme";

export function MarketingLoadingShell() {
  useMarketingLightTheme();

  return <div className="marketing-landing min-h-[100dvh] w-full" aria-hidden />;
}
