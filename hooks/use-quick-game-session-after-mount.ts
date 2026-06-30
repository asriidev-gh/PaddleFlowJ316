"use client";

import { useEffect, useState } from "react";

import type { OperatorFullPayload } from "@/lib/operator-payload";
import { readQuickGamePayload, useQuickGameSession } from "@/lib/quick-game-store";

type QuickGameSessionAfterMount = {
  payload: OperatorFullPayload | undefined;
  mounted: boolean;
};

/** Avoid hydration mismatch: browser session storage is unavailable during SSR. */
export function useQuickGameSessionAfterMount(gameId: string): QuickGameSessionAfterMount {
  const [mounted, setMounted] = useState(false);
  const sessionFromStore = useQuickGameSession(gameId);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!gameId) {
    return { payload: undefined, mounted: false };
  }

  const syncPayload =
    typeof window !== "undefined" ? sessionFromStore ?? readQuickGamePayload(gameId) : undefined;

  if (!mounted) {
    if (syncPayload) {
      return { payload: syncPayload, mounted: true };
    }
    return { payload: undefined, mounted: false };
  }

  return {
    payload: syncPayload,
    mounted: true,
  };
}
