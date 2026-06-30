"use client";

import { useQuery } from "@tanstack/react-query";
import { Gamepad2, Loader2, MonitorSmartphone, Repeat, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EphemeralQuickPlayUsageInsights } from "@/lib/ephemeral-quick-play-usage-shared";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: typeof Gamepad2;
}) {
  return (
    <Card className="glass-panel">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
          {hint ? <p className="caption mt-1">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function formatWhen(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function QuickPlayUsagePanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["insights-quick-play-usage"],
    queryFn: async () => {
      const response = await fetch("/api/insights/quick-play-usage");
      const payload = (await response.json()) as {
        insights?: EphemeralQuickPlayUsageInsights;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load quick play usage.");
      }
      return payload.insights as EphemeralQuickPlayUsageInsights;
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Loading quick play usage…
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="glass-panel">
        <CardContent className="p-6 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load quick play usage."}
        </CardContent>
      </Card>
    );
  }

  const { totals, byDevice, recentSessions, topRepeatVisitors } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Gamepad2} label="Sessions started" value={totals.sessions} />
        <StatCard icon={Users} label="Unique visitors" value={totals.uniqueVisitors} />
        <StatCard
          icon={Repeat}
          label="Repeat visitors"
          value={totals.repeatVisitors}
          hint="Started 2+ sessions"
        />
        <StatCard
          icon={MonitorSmartphone}
          label="Last 7 days"
          value={totals.sessionsLast7Days}
          hint={`${totals.sessionsLast30Days.toLocaleString()} in last 30 days`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="section-title text-xl">By device</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byDevice.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
            ) : (
              byDevice.map((row) => (
                <div key={row.device} className="flex items-center justify-between gap-3 text-sm">
                  <span className="capitalize">{row.device}</span>
                  <span className="font-semibold tabular-nums">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="section-title text-xl">Most active visitors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topRepeatVisitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No repeat visitors yet.</p>
            ) : (
              topRepeatVisitors.slice(0, 10).map((visitor) => (
                <div key={visitor.visitorId} className="rounded-lg border border-border/70 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {visitor.visitorId}
                    </span>
                    <Badge variant="secondary">{visitor.sessionCount} sessions</Badge>
                  </div>
                  <p className="caption mt-2">
                    Last seen {formatWhen(visitor.lastSeenAt)} · {visitor.lastDeviceCategory} ·{" "}
                    {visitor.lastIpAddress || "unknown IP"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="section-title text-xl">Recent sessions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
          ) : (
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-2 py-2 font-medium">When</th>
                  <th className="px-2 py-2 font-medium">Visitor</th>
                  <th className="px-2 py-2 font-medium">Visits</th>
                  <th className="px-2 py-2 font-medium">IP</th>
                  <th className="px-2 py-2 font-medium">Device</th>
                  <th className="px-2 py-2 font-medium">Format</th>
                  <th className="px-2 py-2 font-medium">Courts</th>
                  <th className="px-2 py-2 font-medium">Players</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session) => (
                  <tr key={session.id} className="border-b border-border/60 align-top">
                    <td className="px-2 py-2 whitespace-nowrap">{formatWhen(session.createdAt)}</td>
                    <td className="px-2 py-2 font-mono text-xs">{session.visitorId}</td>
                    <td className="px-2 py-2 tabular-nums">{session.visitorSessionCount}</td>
                    <td className="px-2 py-2 font-mono text-xs">{session.ipAddress}</td>
                    <td className="px-2 py-2 capitalize">{session.deviceCategory}</td>
                    <td className="px-2 py-2">
                      {session.gameMode} · {session.openPlayType}
                    </td>
                    <td className="px-2 py-2 tabular-nums">{session.courtCount}</td>
                    <td className="px-2 py-2 tabular-nums">{session.playerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="caption">
        Anonymous usage only — player names, queue order, and match results are not stored. Generated{" "}
        <span suppressHydrationWarning>{formatWhen(data.generatedAt)}</span>.
      </p>
    </div>
  );
}
