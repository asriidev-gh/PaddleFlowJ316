"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { readPendingEphemeralQuickGameTransfer } from "@/lib/ephemeral-quick-game-transfer-pending";
import { SAVE_QUICK_PLAY_POST_AUTH_PATH } from "@/lib/post-auth-redirect";
import { safeRouterReplace } from "@/lib/safe-router";
import { authMeQueryKey, fetchAuthMe } from "@/hooks/use-auth-me";

export function CompleteEphemeralQuickGameTransfer() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const runningRef = useRef(false);
  const [pendingTransfer, setPendingTransfer] = useState(false);

  useEffect(() => {
    setPendingTransfer(Boolean(readPendingEphemeralQuickGameTransfer()));
  }, []);

  const { data: authData } = useQuery({
    queryKey: authMeQueryKey(),
    queryFn: fetchAuthMe,
    enabled: pendingTransfer,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!authData?.user) return;
    if (!readPendingEphemeralQuickGameTransfer()) return;
    if (runningRef.current) return;

    runningRef.current = true;
    void (async () => {
      try {
        const { completePendingEphemeralQuickGameTransfer } = await import(
          "@/lib/ephemeral-quick-game-transfer"
        );
        const newGameId = await completePendingEphemeralQuickGameTransfer(queryClient);
        if (newGameId) {
          toast.success("Your public session has been saved in your account.");
          safeRouterReplace(router, SAVE_QUICK_PLAY_POST_AUTH_PATH);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save your session.");
      } finally {
        runningRef.current = false;
      }
    })();
  }, [authData?.user, queryClient, router]);

  return null;
}
