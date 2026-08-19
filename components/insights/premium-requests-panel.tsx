"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, ExternalLink, Loader2, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  InsightsPremiumFilter,
  InsightsPremiumRequestItem,
  InsightsPremiumRequestsPayload,
  InsightsPremiumReviewAction,
} from "@/lib/insights-premium-shared";
import { cn } from "@/lib/utils";

const FILTERS: { id: InsightsPremiumFilter; label: string }[] = [
  { id: "pending", label: "Pending review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Not approved" },
  { id: "all", label: "All" },
];

const reviewAlertOptions = {
  background: "#0f172a",
  color: "#e2e8f0",
  confirmButtonColor: "#22c55e",
  cancelButtonColor: "#64748b",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(amountPhp: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amountPhp);
}

function matchesNameFilter(query: string, ...values: (string | null | undefined)[]) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

export function PremiumRequestsPanel() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<InsightsPremiumFilter>("pending");
  const [nameFilter, setNameFilter] = useState("");
  const [proofRequest, setProofRequest] = useState<InsightsPremiumRequestItem | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["insights-premium-requests"],
    queryFn: async () => {
      const response = await fetch("/api/insights/premium-requests");
      const payload = (await response.json()) as InsightsPremiumRequestsPayload & {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load premium submissions.");
      }
      return payload as InsightsPremiumRequestsPayload;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: InsightsPremiumReviewAction;
    }) => {
      const response = await fetch(`/api/insights/premium-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to update premium submission.");
      }
      return payload;
    },
    onSuccess: (payload) => {
      toast.success(payload.message ?? "Updated.");
      void queryClient.invalidateQueries({ queryKey: ["insights-premium-requests"] });
    },
    onError: (reviewError) => {
      toast.error(
        reviewError instanceof Error ? reviewError.message : "Failed to update premium submission.",
      );
    },
  });

  const requests = data?.requests ?? [];
  const visibleRequests = useMemo(() => {
    const byStatus =
      filter === "all" ? requests : requests.filter((request) => request.status === filter);
    return byStatus.filter((request) =>
      matchesNameFilter(nameFilter, request.userName, request.userEmail),
    );
  }, [filter, nameFilter, requests]);

  const handleReview = async (
    request: InsightsPremiumRequestItem,
    action: InsightsPremiumReviewAction,
  ) => {
    const titles = {
      approve: "Grant Premium?",
      reject: "Mark as not approved?",
      revoke: "Remove Premium?",
    };
    const confirmLabels = {
      approve: "Yes, grant Premium",
      reject: "Yes, reject",
      revoke: "Yes, remove Premium",
    };
    const bodies = {
      approve: `<strong>${request.userName}</strong> (${request.userEmail}) will get live queueing, Registered players, My Club, and Marketplace.`,
      reject: `<strong>${request.userName}</strong> (${request.userEmail}) will stay on the free plan.`,
      revoke: `<strong>${request.userName}</strong> (${request.userEmail}) will lose Premium features.`,
    };

    const result = await Swal.fire({
      ...reviewAlertOptions,
      title: titles[action],
      html: bodies[action],
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: confirmLabels[action],
      cancelButtonText: "Cancel",
      confirmButtonColor: action === "approve" ? "#22c55e" : "#ef4444",
    });
    if (!result.isConfirmed) return;
    reviewMutation.mutate({ id: request.id, action });
  };

  const countFor = (id: InsightsPremiumFilter) => {
    if (!data) return null;
    if (id === "all") return data.counts.total;
    return data.counts[id];
  };

  return (
    <>
      <Card className="glass-panel">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="section-title flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-300" aria-hidden />
              Premium submissions
            </CardTitle>
            <Badge variant="secondary" className="tabular-nums">
              {visibleRequests.length} {visibleRequests.length === 1 ? "submission" : "submissions"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Review proof of payment, then grant Premium so the club can use live queueing and owner
            hub tools.
          </p>
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Filter by name or email…"
              className="pl-9"
              aria-label="Filter premium submissions by name or email"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((option) => {
              const count = countFor(option.id);
              return (
                <Button
                  key={option.id}
                  type="button"
                  size="sm"
                  variant={filter === option.id ? "default" : "outline"}
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                  {count != null ? (
                    <span className="ml-1.5 tabular-nums opacity-80">{count}</span>
                  ) : null}
                </Button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="flex items-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading premium submissions…
            </p>
          ) : isError ? (
            <p className="py-6 text-destructive">
              {error instanceof Error ? error.message : "Failed to load premium submissions."}
            </p>
          ) : requests.length === 0 ? (
            <p className="py-6 text-muted-foreground">No clubs have submitted payment yet.</p>
          ) : visibleRequests.length === 0 ? (
            <p className="py-6 text-muted-foreground">No submissions match this filter.</p>
          ) : (
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Club / user</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRequests.map((request) => {
                  const pendingAction =
                    reviewMutation.isPending && reviewMutation.variables?.id === request.id
                      ? reviewMutation.variables.action
                      : null;
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium">{request.userName}</p>
                          <p className="text-muted-foreground">{request.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p>{request.paymentMethodLabel}</p>
                        <p className="tabular-nums text-muted-foreground">
                          {formatAmount(request.amountPhp)}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[14rem] truncate text-muted-foreground">
                        {request.payerNote || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground" suppressHydrationWarning>
                        {formatDate(request.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className={cn(
                              request.status === "pending" &&
                                "bg-amber-500/15 text-amber-800 dark:text-amber-200",
                              request.status === "approved" &&
                                "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                              request.status === "rejected" &&
                                "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                            )}
                          >
                            {request.statusLabel}
                          </Badge>
                          {request.userIsPremium ? (
                            <Badge className="gap-1 bg-amber-600 text-white hover:bg-amber-600/90">
                              <Crown className="h-3 w-3" aria-hidden />
                              Premium
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setProofRequest(request)}
                          >
                            View proof
                          </Button>
                          {request.status === "pending" ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                disabled={Boolean(pendingAction)}
                                onClick={() => handleReview(request, "approve")}
                              >
                                {pendingAction === "approve" ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                                ) : null}
                                Grant Premium
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={Boolean(pendingAction)}
                                onClick={() => handleReview(request, "reject")}
                              >
                                {pendingAction === "reject" ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                                ) : null}
                                Reject
                              </Button>
                            </>
                          ) : request.userIsPremium ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={Boolean(pendingAction)}
                              onClick={() => handleReview(request, "revoke")}
                            >
                              {pendingAction === "revoke" ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : null}
                              Remove Premium
                            </Button>
                          ) : request.status === "approved" ? (
                            <Button
                              type="button"
                              size="sm"
                              disabled={Boolean(pendingAction)}
                              onClick={() => handleReview(request, "approve")}
                            >
                              {pendingAction === "approve" ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : null}
                              Grant Premium
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(proofRequest)}
        onOpenChange={(open) => {
          if (!open) setProofRequest(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment proof</DialogTitle>
            <DialogDescription>
              {proofRequest
                ? `${proofRequest.userName} · ${proofRequest.paymentMethodLabel} · ${formatAmount(proofRequest.amountPhp)}`
                : "Proof of payment image."}
            </DialogDescription>
          </DialogHeader>
          {proofRequest ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofRequest.proofUrl}
                alt={`Payment proof from ${proofRequest.userName}`}
                className="max-h-[60vh] w-full rounded-lg border border-border object-contain bg-muted/20"
              />
              <a
                href={proofRequest.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open full image
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
