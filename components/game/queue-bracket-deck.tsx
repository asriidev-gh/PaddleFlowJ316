import { Clock, Link2, LogOut, Trophy } from "lucide-react";

import { PlayerNameWithPhoto } from "@/components/game/player-avatar";
import type { QueueEntryView } from "@/components/game/queue-entry-row";
import {
  formatSessionRecordLabel,
  formatUpcomingGameBadgeLabel,
  isSessionUndefeated,
} from "@/lib/games-played-map";
import { queueEntryPlayerId } from "@/lib/queue-highlight";
import type { QueueBracketDeck } from "@/lib/queue-display-segments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPlayerDisplayName } from "@/lib/utils";

function formatLastMatchLine(result: QueueEntryView["lastMatchResult"]) {
  if (result === "win") return "Last match: W";
  if (result === "loss") return "Last match: L";
  return "Last match: —";
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

type DeckPlayerProps = {
  entry: QueueEntryView;
  highlighted?: boolean;
  hideControls?: boolean;
  onRemove?: () => void;
  removePending?: boolean;
};

function DeckPlayer({ entry, highlighted, hideControls, onRemove, removePending }: DeckPlayerProps) {
  const stats = {
    wins: entry.wins ?? 0,
    losses: entry.losses ?? 0,
    gamesPlayed: (entry.wins ?? 0) + (entry.losses ?? 0),
  };
  const isUndefeated = isSessionUndefeated(stats);

  return (
    <div
      id={`queue-entry-${entry._id}`}
      className={cn(
        "queue-deck-player rounded-lg border bg-card/60 px-2.5 py-2",
        highlighted && "queue-entry-highlighted",
      )}
    >
      <div className="queue-deck-player-row flex items-center justify-between gap-2">
        <PlayerNameWithPhoto player={entry.playerId} className="min-w-0 text-sm font-medium">
          {formatPlayerDisplayName(entry.playerId.firstName, entry.playerId.lastName)}
        </PlayerNameWithPhoto>
        <Badge variant="outline" className="h-5 shrink-0 whitespace-nowrap px-1.5 text-[10px]">
          {formatUpcomingGameBadgeLabel(entry.gamesPlayed ?? 0)}
        </Badge>
      </div>
      <p className="caption mt-1 text-[11px] text-muted-foreground">
        {formatLastMatchLine(entry.lastMatchResult)}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {isUndefeated ? (
          <UndefeatedBadge className="h-5 px-1.5 text-[10px]" />
        ) : null}
        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
          {formatSessionRecordLabel(stats)}
        </Badge>
      </div>
      {!hideControls && onRemove ? (
        <div className="mt-1.5 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="queue-remove-btn h-7 border-destructive/50 px-2.5 text-xs text-destructive"
            onClick={onRemove}
            disabled={removePending}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Check Out
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type QueueBracketDeckContainerProps = {
  deck: QueueBracketDeck<QueueEntryView>;
  hideControls?: boolean;
  onRemove?: (entry: QueueEntryView) => void;
  removePendingEntryId?: string | null;
  highlightedPlayerId?: string | null;
};

export function QueueBracketDeckContainer({
  deck,
  hideControls,
  onRemove,
  removePendingEntryId,
  highlightedPlayerId,
}: QueueBracketDeckContainerProps) {
  const slot = deck.slots[0];
  if (!slot) return null;

  return (
    <div className="queue-bracket-deck-match space-y-2">
      <div className="queue-bracket-deck-side rounded-lg border bg-muted/30 p-2.5">
        <div className="space-y-2">
          {slot.pair.map((entry, i) => (
            <div key={entry._id}>
              {i > 0 ? (
                <div className="queue-bracket-deck-partner" aria-hidden>
                  <Link2 className="h-3 w-3" />
                  <span>Partners</span>
                </div>
              ) : null}
              <DeckPlayer
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
      </div>
      <div className="queue-bracket-deck-vs rounded-md border border-dashed px-2 py-1 text-center text-[11px] font-semibold text-muted-foreground">
        vs
      </div>
      <div className="queue-bracket-deck-side queue-bracket-deck-side--waiting rounded-lg border bg-muted/30 p-2.5">
        {slot.opponents.length > 0 &&
        slot.opponents.every((e) => e.queueType === "normal") ? (
          <p className="mb-1 text-xs font-semibold text-muted-foreground">(unplayed from line)</p>
        ) : null}
        {slot.needsOpponent && slot.opponents.length === 0 ? (
          <div className="queue-bracket-deck-waiting">
            <Clock className="mb-1 h-6 w-6 text-muted-foreground/70" aria-hidden />
            <p className="text-sm italic text-muted-foreground">waiting for opponent</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slot.opponents.map((entry) => (
              <DeckPlayer
                key={entry._id}
                entry={entry}
                highlighted={
                  highlightedPlayerId != null &&
                  queueEntryPlayerId(entry) === highlightedPlayerId
                }
                hideControls={hideControls}
                onRemove={onRemove ? () => onRemove(entry) : undefined}
                removePending={removePendingEntryId === entry._id}
              />
            ))}
            {slot.needsOpponent ? (
              <p className="text-sm italic text-muted-foreground">waiting for opponent</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
