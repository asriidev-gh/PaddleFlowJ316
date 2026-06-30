"use client";

import { useParams } from "next/navigation";

import { GameDashboard } from "@/components/game/game-dashboard";
import { SinglesGameDashboard } from "@/components/singles/singles-game-dashboard";
import { useQuickGameSessionAfterMount } from "@/hooks/use-quick-game-session-after-mount";
import { isQuickGame } from "@/lib/local-game-id";

type QuickPlayDashboardRouterProps = {
  quickGameSurface: "account" | "ephemeral";
};

export function QuickPlayDashboardRouter({ quickGameSurface }: QuickPlayDashboardRouterProps) {
  const gameId = String(useParams().id ?? "");
  const { payload } = useQuickGameSessionAfterMount(gameId);

  if (payload?.game.gameMode === "singles" && isQuickGame(gameId)) {
    return <SinglesGameDashboard quickGameSurface={quickGameSurface} />;
  }

  return <GameDashboard mode="operator" quickGameSurface={quickGameSurface} />;
}
