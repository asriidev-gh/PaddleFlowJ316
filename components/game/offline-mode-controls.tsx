"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudOff, CloudUpload, Loader2, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OfflineModeStatus = {
  enabled: boolean;
  offline: boolean;
  savedAt?: string;
  offlineSince?: string;
  pendingSync: boolean;
  snapshotExists: boolean;
  autoFallback: boolean;
};

function offlineModeQueryKey(gameId: string) {
  return ["game", gameId, "offline-mode"] as const;
}

async function fetchOfflineModeStatus(gameId: string): Promise<OfflineModeStatus> {
  const response = await fetch(`/api/games/${gameId}/offline-mode`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(typeof payload.message === "string" ? payload.message : "Failed to load offline status.");
  }
  return payload as OfflineModeStatus;
}

function formatSavedAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

type OfflineModeControlsProps = {
  gameId: string;
  className?: string;
};

export function OfflineModeBanner({ gameId, className }: OfflineModeControlsProps) {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: offlineModeQueryKey(gameId),
    queryFn: () => fetchOfflineModeStatus(gameId),
    refetchOnWindowFocus: false,
    staleTime: 15_000,
  });

  const enterMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/games/${gameId}/offline-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enter" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(typeof payload.message === "string" ? payload.message : "Failed to enter offline mode.");
      }
      return payload;
    },
    onSuccess: (payload) => {
      toast.success(
        typeof payload.message === "string"
          ? payload.message
          : "Offline mode enabled. Local JSON is now the source of truth.",
      );
      void queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      void queryClient.invalidateQueries({ queryKey: offlineModeQueryKey(gameId) });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/games/${gameId}/offline-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(typeof payload.message === "string" ? payload.message : "Failed to sync offline changes.");
      }
      return payload;
    },
    onSuccess: (payload) => {
      toast.success(
        typeof payload.message === "string"
          ? payload.message
          : "Offline changes synced to MongoDB.",
      );
      void queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      void queryClient.invalidateQueries({ queryKey: offlineModeQueryKey(gameId) });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const status = statusQuery.data;
  if (!status?.enabled) return null;

  const pending = enterMutation.isPending || syncMutation.isPending;
  const savedLabel = formatSavedAt(status.offline ? status.offlineSince ?? status.savedAt : status.savedAt);

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 sm:px-4",
        status.offline
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-border/70 bg-muted/40",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {status.offline ? (
              <WifiOff className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            ) : (
              <CloudOff className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            {status.offline ? "Offline mode active" : "Offline fallback available"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {status.offline ? (
              <>
                Queue changes save to <code className="text-[11px]">data/offline/{gameId}.json</code>
                {savedLabel ? ` · snapshot ${savedLabel}` : ""}. Spectator and player views will not update until you sync.
              </>
            ) : (
              <>
                Switch to offline mode when MongoDB is unreachable or over limit. A local JSON snapshot becomes the source of truth until you sync back.
                {status.snapshotExists && savedLabel ? ` Last backup: ${savedLabel}.` : ""}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!status.offline ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => enterMutation.mutate()}
            >
              {enterMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <WifiOff className="mr-2 h-4 w-4" aria-hidden />
              )}
              Use offline mode
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="default"
              disabled={pending}
              onClick={() => syncMutation.mutate()}
            >
              {syncMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CloudUpload className="mr-2 h-4 w-4" aria-hidden />
              )}
              Sync to MongoDB
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
