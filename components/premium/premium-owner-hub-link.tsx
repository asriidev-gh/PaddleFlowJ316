"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PremiumBadge } from "@/components/home/premium-badge";
import { cn } from "@/lib/utils";

type PremiumOwnerHubTileProps = {
  enabled: boolean;
  href: string;
  label: string;
  icon: LucideIcon;
  className?: string;
  topContent?: ReactNode;
  ariaLabel?: string;
};

export function PremiumOwnerHubTile({
  enabled,
  href,
  label,
  icon: Icon,
  className,
  topContent,
  ariaLabel,
}: PremiumOwnerHubTileProps) {
  const destination = enabled ? href : "/premium";
  const tileClassName = cn(
    "home-dashboard-tile flex min-h-[5.5rem] flex-col items-start justify-between rounded-2xl border border-border/70 p-4 text-left transition-colors",
    enabled
      ? "bg-sky-500/8 hover:bg-sky-500/12 dark:bg-sky-400/10 dark:hover:bg-sky-400/15"
      : "bg-muted/20 opacity-80 hover:bg-muted/30",
    className,
  );

  return (
    <Link href={destination} className={tileClassName} aria-label={ariaLabel ?? label}>
      <div className="flex w-full items-start justify-between gap-2">
        {topContent ?? <Icon className="h-6 w-6 text-primary" aria-hidden />}
        {!enabled ? <PremiumBadge className="px-1.5 text-[0.5625rem] font-medium normal-case" /> : null}
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}

type PremiumOwnerHubNavLinkProps = {
  enabled: boolean;
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  activeClass: string;
};

export function PremiumOwnerHubNavLink({
  enabled,
  href,
  label,
  icon: Icon,
  active,
  activeClass,
}: PremiumOwnerHubNavLinkProps) {
  const destination = enabled ? href : "/premium";

  return (
    <Link
      href={destination}
      className={cn(
        "owner-hub-nav__link",
        active && enabled && activeClass,
        !enabled && "owner-hub-nav__link--premium-locked opacity-70",
      )}
      aria-current={active && enabled ? "page" : undefined}
      aria-disabled={!enabled ? true : undefined}
    >
      <span className="owner-hub-nav__icon" aria-hidden>
        <Icon className="h-4 w-4 shrink-0" />
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
        {label}
        {!enabled ? (
          <PremiumBadge className="px-1.5 text-[0.5625rem] font-medium normal-case" />
        ) : null}
      </span>
    </Link>
  );
}
