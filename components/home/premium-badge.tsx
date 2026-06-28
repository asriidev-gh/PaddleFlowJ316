import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 rounded-full border-amber-500/45 bg-amber-500/10 px-2 py-0 text-[0.625rem] font-semibold tracking-wide text-amber-900 dark:text-amber-100",
        className,
      )}
    >
      Premium
    </Badge>
  );
}

export function FreeBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 rounded-full border-sky-500/40 bg-sky-500/10 px-2 py-0 text-[0.625rem] font-semibold tracking-wide text-sky-900 dark:text-sky-100",
        className,
      )}
    >
      Free
    </Badge>
  );
}
