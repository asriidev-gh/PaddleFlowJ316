"use client";

import { useState } from "react";

import { DeveloperAboutDialog } from "@/components/developer-about-dialog";
import { cn } from "@/lib/utils";

type DeveloperCreditLinkProps = {
  className?: string;
  marketingLight?: boolean;
};

export function DeveloperCreditLink({ className, marketingLight = false }: DeveloperCreditLinkProps) {
  const [developerDialogOpen, setDeveloperDialogOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setDeveloperDialogOpen(true)}
        className={cn(
          "cursor-pointer underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          marketingLight
            ? "text-[color:rgb(12_42_34/0.62)] hover:text-[var(--marketing-ink,#0c2a22)] focus-visible:ring-[var(--marketing-accent-deep,#2f8f2a)] focus-visible:ring-offset-[var(--marketing-bg,#f4f8f6)]"
            : "hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background",
          className,
        )}
      >
        Developed by: ASRII
      </button>

      <DeveloperAboutDialog
        open={developerDialogOpen}
        onOpenChange={setDeveloperDialogOpen}
        marketingLight={marketingLight}
      />
    </>
  );
}
