import {
  resolveSpectatorPlayerSkillLevelLabel,
  type SpectatorPlayerCardPlayer,
} from "@/lib/spectator-player-card-shared";
import { cn } from "@/lib/utils";

type SkillBand = "beginner" | "intermediate" | "advanced" | "pro";

function resolveSkillBand(label: string): SkillBand {
  const normalized = label.trim().toLowerCase();

  if (normalized === "pro") return "pro";
  if (normalized.includes("advanced")) return "advanced";
  if (normalized.includes("beginner")) return "beginner";
  if (
    normalized.includes("intermediate") ||
    normalized === "int" ||
    normalized === "il" ||
    normalized === "ih"
  ) {
    return "intermediate";
  }

  return "intermediate";
}

/** Compact label for tight queue/court name rows. */
export function formatSkillLevelShortLabel(label: string): string {
  const normalized = label.trim().toLowerCase();

  switch (normalized) {
    case "beginner":
      return "Beg";
    case "intermediate low":
    case "low intermediate":
      return "IL";
    case "intermediate":
      return "Int";
    case "intermediate high":
    case "high intermediate":
      return "IH";
    case "advanced":
      return "Adv";
    case "pro":
      return "Pro";
    default:
      return label.trim();
  }
}

export function PlayerSkillLevelPill({
  player,
  openPlayLevel,
  pickleballLevel,
  className,
}: {
  player?: SpectatorPlayerCardPlayer | null;
  openPlayLevel?: string | null;
  pickleballLevel?: string | null;
  className?: string;
}) {
  const label = resolveSpectatorPlayerSkillLevelLabel(
    player ?? { firstName: "", lastName: "", openPlayLevel, pickleballLevel },
  );
  if (!label) return null;

  const shortLabel = formatSkillLevelShortLabel(label);
  const band = resolveSkillBand(label);

  return (
    <span
      className={cn(
        "player-skill-level-pill",
        `player-skill-level-pill--${band}`,
        className,
      )}
      title={label}
      aria-label={`Skill level ${label}`}
    >
      {shortLabel}
    </span>
  );
}
