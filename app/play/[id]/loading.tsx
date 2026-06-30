"use client";

import { Loader2 } from "lucide-react";

export default function QuickPlayDashboardLoading() {
  return (
    <main className="game-dashboard--operator flex min-h-screen flex-col items-center justify-center gap-3 p-6">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">Opening session…</p>
    </main>
  );
}
