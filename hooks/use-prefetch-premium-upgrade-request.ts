"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  fetchPremiumUpgradeRequest,
  premiumUpgradeRequestQueryKey,
} from "@/lib/fetch-premium-upgrade";
import { premiumUpgradeQueryOptions } from "@/lib/premium-upgrade-query-options";

/** Warm the upgrade-request API in the background so the dialog opens faster. */
export function usePrefetchPremiumUpgradeRequest(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    void queryClient.prefetchQuery({
      queryKey: premiumUpgradeRequestQueryKey,
      queryFn: fetchPremiumUpgradeRequest,
      ...premiumUpgradeQueryOptions,
    });
  }, [enabled, queryClient]);
}
