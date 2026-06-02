import { ArrowLeftRight, Clock, Link2, LogOut, Swords, Trophy, Users } from "lucide-react";

import { PlayerAvatar } from "@/components/game/player-avatar";
import type { QueueEntryView } from "@/components/game/queue-entry-row";
import {
  formatSessionRecordLabel,
  formatUpcomingGameBadgeLabel,
  isSessionUndefeated,
} from "@/lib/games-played-map";
import { queueEntryPlayerId } from "@/lib/queue-highlight";
import type { QueueCourtMatchSegment } from "@/lib/queue-display-segments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPlayerDisplayName } from "@/lib/utils";

type MatchPreviewMeta = {
  title: string;
  hint: string;
  status: "ready" | "needs-opponent";
  statusLabel: string;
  variant: "winner" | "loser" | "normal";
};

function getMatchPreviewMeta(segment: QueueCourtMatchSegment<QueueEntryView>): MatchPreviewMeta {
  if (segment.mode === "winner-pairs") {
    const hasNormals = [...segment.teamA, ...segment.teamB].some((e) => e.queueType === "normal");
    return {
      title: "Winners bracket",
      hint: hasNormals
        ? "Winning pair vs unplayed players from the end of the line."
        : "Winning pairs face each other when this court fills.",
      status: "ready",
      statusLabel: "Ready to fill",
      variant: "winner",
    };
  }
  if (segment.mode === "loser-pairs") {
    return {
      title: "Losers bracket",
      hint: "Losing pairs face each other when this court fills.",
      status: "ready",
      statusLabel: "Ready to fill",
      variant: "loser",
    };
  }
  return {
    title: "Open court",
    hint: "",
    status: "ready",
    statusLabel: "Ready to fill",
    variant: "normal",
  };
}

function formatLastMatchLine(result: QueueEntryView["lastMatchResult"]) {
  if (result === "win") return "Last match: W";
  if (result === "loss") return "Last match: L";
  return "Last match: —";
}

function MatchPreviewIcon({ variant }: { variant: MatchPreviewMeta["variant"] }) {
  const className = "h-4 w-4 shrink-0";
  if (variant === "winner") return <Trophy className={className} aria-hidden />;
  if (variant === "loser") return <Swords className={className} aria-hidden />;
  return <Users className={className} aria-hidden />;
}

function UndefeatedBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("queue-undefeated-badge whitespace-nowrap", className)}
      aria-label="Undefeated — 3 or more wins, no losses"
    >
      <Trophy className="queue-undefeated-badge-icon" aria-hidden />
      <span className="queue-undefeated-badge-text">Undefeated</span>
    </Badge>
  );
}

type MatchPreviewPlayerProps = {
  entry: QueueEntryView;
  highlighted?: boolean;
  hideControls?: boolean;
  onRemove?: () => void;
  removePending?: boolean;
};

function MatchPreviewPlayer({
  entry,
  highlighted,
  hideControls,
  onRemove,
  removePending,
}: MatchPreviewPlayerProps) {
  return (
    <div
      id={`queue-entry-${entry._id}`}
      className={cn("queue-match-preview-player", highlighted && "queue-entry-highlighted")}
    >
      <div className="queue-match-preview-player-main">
        <PlayerAvatar player={entry.playerId} size="sm" className="!size-10 sm:!size-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight text-foreground">
            {formatPlayerDisplayName(entry.playerId.firstName, entry.playerId.lastName)}
          </p>
          <p className="caption truncate text-muted-foreground">
            {formatLastMatchLine(entry.lastMatchResult)}
          </p>
        </div>
        <Badge variant="outline" className="queue-upcoming-game-badge shrink-0 whitespace-nowrap">
          {formatUpcomingGameBadgeLabel(entry.gamesPlayed ?? 0)}
        </Badge>
      </div>
      {!hideControls && onRemove ? (
        <div className="queue-match-preview-player-actions">
          <Button
            size="sm"
            variant="outline"
            className="queue-remove-btn h-8 border-destructive/50 px-2.5 text-destructive"
            onClick={onRemove}
            disabled={removePending}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Check out
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function MatchPreviewTeam({
  teamLabel,
  variant,
  players,
  waiting = false,
  hideControls,
  onRemove,
  removePendingEntryId,
  highlightedPlayerId,
}: {
  teamLabel: string;
  variant: MatchPreviewMeta["variant"];
  players: QueueEntryView[];
  waiting?: boolean;
  hideControls?: boolean;
  onRemove?: (entry: QueueEntryView) => void;
  removePendingEntryId?: string | null;
  highlightedPlayerId?: string | null;
}) {
  return (
    <div
      className={cn(
        "queue-match-preview-team",
        variant === "winner" && "queue-match-preview-team--winner",
        variant === "loser" && "queue-match-preview-team--loser",
        variant === "normal" && "queue-match-preview-team--normal",
        waiting && "queue-match-preview-team--waiting",
      )}
    >
      <div className="queue-match-preview-team-label">
        <span>{teamLabel}</span>
      </div>
      {waiting ? (
        <div className="queue-match-preview-waiting-slot">
          <Clock className="mb-2 h-8 w-8 text-muted-foreground/70" aria-hidden />
          <p className="text-sm font-medium text-foreground">Waiting for opponent</p>
        </div>
      ) : (
        <div className="queue-match-preview-roster">
          {players.map((entry, index) => (
            <div key={entry._id} className="queue-match-preview-roster-item">
              {index > 0 ? (
                <div className="queue-match-preview-partner-link" aria-hidden>
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Partners</span>
                </div>
              ) : null}
              <MatchPreviewPlayer
                entry={entry}
                highlighted={
                  highlightedPlayerId != null &&
                  queueEntryPlayerId(entry) === highlightedPlayerId
                }
                hideControls={hideControls}
                onRemove={onRemove ? () => onRemove(entry) : undefined}
                removePending={removePendingEntryId === entry._id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompactOpenCourtPlayerRow({
  entry,
  slotLabel,
  highlighted,
  hideControls,
  onReplace,
  replacePending,
  onRemove,
  removePending,
}: {
  entry: QueueEntryView;
  slotLabel: string;
  highlighted?: boolean;
  hideControls?: boolean;
  onReplace?: (entry: QueueEntryView) => void;
  replacePending?: boolean;
  onRemove?: (entry: QueueEntryView) => void;
  removePending?: boolean;
}) {
  const stats = {
    wins: entry.wins ?? 0,
    losses: entry.losses ?? 0,
    gamesPlayed: (entry.wins ?? 0) + (entry.losses ?? 0),
  };
  const isUndefeated = isSessionUndefeated(stats);
  const recordLabel = formatSessionRecordLabel(stats);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border bg-card/50 px-2 py-1",
        highlighted && "queue-entry-highlighted",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {slotLabel}
        </span>
        <PlayerAvatar
          player={entry.playerId}
          size="sm"
          className="!size-9"
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium leading-tight text-foreground">
            {formatPlayerDisplayName(entry.playerId.firstName, entry.playerId.lastName)}
          </p>
          <p className="caption truncate text-[0.65rem] text-muted-foreground">
            {formatLastMatchLine(entry.lastMatchResult)}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {formatUpcomingGameBadgeLabel(entry.gamesPlayed ?? 0)}
            </Badge>
            {isUndefeated ? (
              <UndefeatedBadge className="h-5 px-1.5 text-[10px]" />
            ) : null}
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {recordLabel}
            </Badge>
          </div>
        </div>
      </div>

      {!hideControls ? (
        <div className="flex items-center gap-1">
          {onReplace ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 py-0 text-xs"
              onClick={() => onReplace(entry)}
              disabled={replacePending}
            >
              <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
              Replace
            </Button>
          ) : null}
          {onRemove ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 py-0 text-xs"
              onClick={() => onRemove(entry)}
              disabled={removePending}
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Check out
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type QueueMatchPreviewCardProps = {
  segment: QueueCourtMatchSegment<QueueEntryView>;
  queueSlotLabel?: string;
  hideControls?: boolean;
  onRemove?: (entry: QueueEntryView) => void;
  onReplace?: (entry: QueueEntryView) => void;
  replacePendingEntryId?: string | null;
  removePendingEntryId?: string | null;
  highlightedPlayerId?: string | null;
  /** Compact card for Open court previews (reduces vertical whitespace). */
  compact?: boolean;
};

export function QueueMatchPreviewCard({
  segment,
  queueSlotLabel,
  hideControls,
  onRemove,
  onReplace,
  replacePendingEntryId,
  removePendingEntryId,
  highlightedPlayerId,
  compact = false,
}: QueueMatchPreviewCardProps) {
  const meta = getMatchPreviewMeta(segment);
  const teamBAreTailNormals =
    segment.mode === "winner-pairs" &&
    segment.teamB.length > 0 &&
    segment.teamB.every((e) => e.queueType === "normal");
  const teamLabels =
    segment.mode === "winner-pairs"
      ? {
          a: "Winners · pair A",
          b: teamBAreTailNormals ? "Unplayed · from line" : "Winners · pair B",
        }
      : segment.mode === "loser-pairs"
        ? { a: "Losers · pair A", b: "Losers · pair B" }
        : { a: "Slots 1–2", b: "Slots 3–4" };

  const isCompactOpenCourt = compact && segment.mode === "fifo" && meta.variant === "normal";

  return (
    <article
      className={cn(
        "queue-match-preview border bg-card/70 shadow-sm",
        compact
          ? "rounded-lg p-2 sm:p-3"
          : "rounded-xl p-3 sm:p-4",
        `queue-match-preview--${meta.variant}`,
      )}
      aria-label={meta.title}
    >
      <header
        className={cn(
          "queue-match-preview-header flex items-start justify-between gap-2 border-b pb-2",
          compact ? "mb-2" : "mb-3 pb-3",
        )}
      >
        <div className="flex min-w-0 items-start gap-2">
          {queueSlotLabel ? (
            <span className="queue-match-preview-index shrink-0" aria-hidden>
              {queueSlotLabel}
            </span>
          ) : null}
          <MatchPreviewIcon variant={meta.variant} />
          <div className="min-w-0 space-y-1">
            <h4 className="queue-match-preview-title">{meta.title}</h4>
            {meta.hint ? (
              <p
                className={cn(
                  "queue-match-preview-hint",
                  compact ? "min-h-[1.8rem]" : "min-h-[2.5rem]",
                )}
              >
                {meta.hint}
              </p>
            ) : null}
          </div>
        </div>
        {segment.mode !== "fifo" ? (
          <Badge
            variant="outline"
            className="queue-match-preview-status queue-match-preview-status--ready mt-0.5 shrink-0"
          >
            {meta.statusLabel}
          </Badge>
        ) : null}
      </header>

      {isCompactOpenCourt ? (
        <div className="space-y-1.5">
          {[...segment.teamA, ...segment.teamB].map((entry, index) => {
            const slotLabel = index < 2 ? `A${index + 1}` : `B${index - 1}`;
            return (
              <CompactOpenCourtPlayerRow
                key={entry._id}
                entry={entry}
                slotLabel={slotLabel}
                highlighted={
                  highlightedPlayerId != null && queueEntryPlayerId(entry) === highlightedPlayerId
                }
                hideControls={hideControls}
                onReplace={onReplace}
                replacePending={replacePendingEntryId === entry._id}
                onRemove={onRemove}
                removePending={removePendingEntryId === entry._id}
              />
            );
          })}
        </div>
      ) : (
        <div
          className={cn(
            "queue-match-preview-body grid grid-cols-1 xl:items-stretch xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
            compact ? "gap-2" : "gap-3",
          )}
        >
          <MatchPreviewTeam
            teamLabel={teamLabels.a}
            variant={meta.variant}
            players={segment.teamA}
            hideControls={hideControls}
            onRemove={onRemove}
            removePendingEntryId={removePendingEntryId}
            highlightedPlayerId={highlightedPlayerId}
          />
          <div className="queue-match-preview-vs self-center justify-self-center" aria-hidden>
            <span className="queue-match-preview-vs-puck">vs</span>
          </div>
          <MatchPreviewTeam
            teamLabel={teamLabels.b}
            variant={meta.variant}
            players={segment.teamB}
            waiting={Boolean(segment.teamBNeedsOpponent)}
            hideControls={hideControls}
            onRemove={onRemove}
            removePendingEntryId={removePendingEntryId}
            highlightedPlayerId={highlightedPlayerId}
          />
        </div>
      )}
    </article>
  );
}
