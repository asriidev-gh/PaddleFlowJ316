"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  MatchHistoryList,
  type MatchHistoryView,
} from "@/components/game/match-history-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchOperatorMatchHistory,
  operatorMatchHistoryQueryKey,
} from "@/lib/fetch-operator-game";
import { isQuickGame } from "@/lib/local-game-id";
import { operatorMatchHistoryQueryOptions } from "@/lib/operator-query-options";
import { cn } from "@/lib/utils";

const MATCH_HISTORY_STORAGE_KEY = "ccf-match-history-visible";

function loadMatchHistoryVisible() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MATCH_HISTORY_STORAGE_KEY) === "true";
}

function saveMatchHistoryVisible(visible: boolean) {
  localStorage.setItem(MATCH_HISTORY_STORAGE_KEY, visible ? "true" : "false");
}

type CourtsViewMatchHistoryPanelProps = {
  gameId: string;
  editable?: boolean;
  /** Quick-play / local session matches; when set, skips the operator history API. */
  localMatches?: MatchHistoryView[] | null;
};

export function CourtsViewMatchHistoryPanel({
  gameId,
  editable = true,
  localMatches = null,
}: CourtsViewMatchHistoryPanelProps) {
  const [showMatchHistory, setShowMatchHistory] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);
  const isLocalSession = isQuickGame(gameId);

  useEffect(() => {
    setShowMatchHistory(loadMatchHistoryVisible());
    setPrefsReady(true);
  }, []);

  const historyQuery = useQuery({
    queryKey: operatorMatchHistoryQueryKey(gameId),
    queryFn: () => fetchOperatorMatchHistory(gameId),
    enabled: Boolean(gameId) && !isLocalSession && showMatchHistory && prefsReady,
    ...operatorMatchHistoryQueryOptions,
  });

  const matches = useMemo(() => {
    if (isLocalSession) return localMatches ?? [];
    return historyQuery.data?.matches ?? localMatches ?? [];
  }, [historyQuery.data?.matches, isLocalSession, localMatches]);

  const caption = (() => {
    if (!showMatchHistory) return "Expand to view match history";
    if (!isLocalSession && historyQuery.isLoading && !historyQuery.data) {
      return "Loading match history…";
    }
    const count = matches.length;
    return count === 0
      ? "No matches recorded yet"
      : `${count} match${count === 1 ? "" : "es"} this session`;
  })();

  return (
    <Card className="glass-panel match-history-panel dashboard-panel dashboard-panel--history">
      <CardHeader className="flex flex-col gap-3">
        <div className="match-history-panel-header flex w-full flex-nowrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle>Match History</CardTitle>
            <p className="caption">{caption}</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 self-center">
            {showMatchHistory && !isLocalSession ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="match-history-refresh"
                onClick={() => void historyQuery.refetch()}
                disabled={historyQuery.isFetching}
                aria-label="Refresh match history"
              >
                <RefreshCw
                  className={cn("h-4 w-4", historyQuery.isFetching && "animate-spin")}
                />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="match-history-toggle"
              onClick={() => {
                const next = !showMatchHistory;
                setShowMatchHistory(next);
                saveMatchHistoryVisible(next);
              }}
              aria-expanded={showMatchHistory}
              aria-controls={`courts-view-match-history-${gameId}`}
            >
              {showMatchHistory ? (
                <>
                  <ChevronUp className="mr-1.5 h-4 w-4" />
                  Hide match history
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1.5 h-4 w-4" />
                  Show match history
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {showMatchHistory ? (
        <CardContent
          id={`courts-view-match-history-${gameId}`}
          className="dashboard-panel-content"
        >
          {!isLocalSession && historyQuery.isLoading && !historyQuery.data ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Loading match history…
            </div>
          ) : (
            <MatchHistoryList
              matches={matches}
              gameId={gameId}
              editable={editable}
              showNameFilter
            />
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
