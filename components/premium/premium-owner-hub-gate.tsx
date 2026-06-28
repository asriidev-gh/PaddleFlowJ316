"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { PremiumBadge } from "@/components/home/premium-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthMe } from "@/hooks/use-auth-me";
import { canUseOwnerHubTools } from "@/lib/premium-access";

export function PremiumOwnerHubGate({ children }: { children: ReactNode }) {
  const { data: authData, isLoading } = useAuthMe();
  const hasAccess = canUseOwnerHubTools(authData?.user);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="glass-panel border-amber-500/30">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-foreground">Premium feature</p>
              <PremiumBadge />
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Registered players, My Club, and Marketplace are included with Premium. Upgrade to
              manage your roster, club community, and listings.
            </p>
          </div>
          <Button nativeButton={false} render={<Link href="/premium" />} className="shrink-0 gap-2">
            <Sparkles className="h-4 w-4" aria-hidden />
            View premium details
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
