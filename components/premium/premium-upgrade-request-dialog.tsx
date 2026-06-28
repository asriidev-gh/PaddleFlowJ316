"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  MarketplacePaymentProofField,
  type MarketplacePaymentProofValue,
} from "@/components/marketplace/marketplace-payment-proof-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchPremiumUpgradeRequest,
  premiumUpgradeRequestQueryKey,
  submitPremiumUpgradeRequest,
} from "@/lib/fetch-premium-upgrade";
import { getClientPremiumPaymentConfig } from "@/lib/premium-payment-config-client";
import { MAX_PREMIUM_UPGRADE_NOTE_LENGTH, type PremiumPaymentMethod } from "@/lib/premium-payment-shared";
import { premiumUpgradeQueryOptions } from "@/lib/premium-upgrade-query-options";
import { cn } from "@/lib/utils";

const emptyPaymentProof: MarketplacePaymentProofValue = { file: null };

type PremiumUpgradeRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function PremiumSubmissionThanks() {
  return (
    <div className="space-y-4 py-2 text-center sm:text-left">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 sm:mx-0">
        <CheckCircle2 className="h-7 w-7" aria-hidden />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Thank you!</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We&apos;ve received your proof of payment. Our team will review it and validate your
          submission, usually within one to two business days.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Once approved, Premium will be activated on your account. We appreciate your support and
          look forward to helping you run great open-play sessions.
        </p>
      </div>
    </div>
  );
}

function PremiumPendingReview({
  submittedAt,
  paymentMethodLabel,
}: {
  submittedAt: string;
  paymentMethodLabel: string;
}) {
  const submittedLabel = new Date(submittedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/8 p-4">
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Submission under review</p>
          <p className="text-sm text-muted-foreground">
            You submitted payment via {paymentMethodLabel} on {submittedLabel}. We&apos;ll notify you
            once your proof of payment has been validated.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PremiumUpgradeRequestDialog({ open, onOpenChange }: PremiumUpgradeRequestDialogProps) {
  const queryClient = useQueryClient();
  const config = useMemo(() => getClientPremiumPaymentConfig(), []);
  const [paymentMethod, setPaymentMethod] = useState<PremiumPaymentMethod>("gcash_maya");
  const [payerNote, setPayerNote] = useState("");
  const [paymentProof, setPaymentProof] = useState<MarketplacePaymentProofValue>(emptyPaymentProof);
  const [submitted, setSubmitted] = useState(false);

  const requestQuery = useQuery({
    queryKey: premiumUpgradeRequestQueryKey,
    queryFn: fetchPremiumUpgradeRequest,
    enabled: open,
    ...premiumUpgradeQueryOptions,
  });

  const latestRequest = requestQuery.data;
  const pendingRequest = latestRequest?.status === "pending" ? latestRequest : null;

  const selectedMethod = useMemo(
    () => config.methods.find((method) => method.id === paymentMethod) ?? null,
    [config.methods, paymentMethod],
  );

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setPaymentProof(emptyPaymentProof);
      setPayerNote("");
      return;
    }
    setPaymentMethod(config.methods[0]?.id ?? "gcash_maya");
  }, [open, config.methods]);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!paymentProof.file) {
        throw new Error("Upload proof of payment to continue.");
      }
      return submitPremiumUpgradeRequest({
        paymentMethod,
        payerNote,
        proofFile: paymentProof.file,
      });
    },
    onSuccess: async () => {
      setSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: premiumUpgradeRequestQueryKey });
      toast.success("Payment proof submitted. Thank you!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not submit payment proof.");
    },
  });

  const canSubmit = Boolean(paymentProof.file) && !submitMutation.isPending;
  const showThanks = submitted || Boolean(pendingRequest);
  const checkingExistingSubmission = requestQuery.isPending && !requestQuery.data && !submitted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,48rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-300" aria-hidden />
            Premium — annual plan
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{config.formattedPrice}</span>{" "}
            {config.billingPeriodLabel}. Pay using one of the options below, then upload your proof of
            payment.
          </DialogDescription>
        </DialogHeader>

        {checkingExistingSubmission ? (
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/15 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Checking for an existing submission…
          </div>
        ) : null}

        {showThanks ? (
          pendingRequest && !submitted ? (
            <PremiumPendingReview
              submittedAt={pendingRequest.createdAt}
              paymentMethodLabel={pendingRequest.paymentMethodLabel}
            />
          ) : (
            <PremiumSubmissionThanks />
          )
        ) : requestQuery.isError ? (
          <div className="space-y-4">
            <p className="text-sm text-destructive">
              {requestQuery.error instanceof Error
                ? requestQuery.error.message
                : "Could not check your existing submission."}
            </p>
            <p className="text-sm text-muted-foreground">
              You can still complete payment below. If you already submitted proof, wait a moment and
              reopen this dialog.
            </p>
            {/* fall through to form - render form below via not using early return only */}
          </div>
        ) : null}

        {!showThanks ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-border/70 bg-muted/15 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Amount to pay
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {config.formattedPrice}
                <span className="ml-2 text-sm font-normal text-muted-foreground">/ year</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Payment method</Label>
              <div className="grid gap-2">
                {config.methods.map((method) => {
                  const selected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                        selected
                          ? "border-amber-500/50 bg-amber-500/10"
                          : "border-border/70 bg-background hover:bg-muted/20",
                      )}
                    >
                      <span className="font-medium text-foreground">{method.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {method.instructions}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedMethod?.qrUrl ? (
              <div className="space-y-2">
                <Label>Scan to pay</Label>
                <div className="flex justify-center rounded-xl border border-border/70 bg-background p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedMethod.qrUrl}
                    alt={`${selectedMethod.label} payment QR code`}
                    className="max-h-64 w-full max-w-xs object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Pay exactly {config.formattedPrice}. Keep your reference number handy if your app
                  provides one.
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="premium-payer-note">Reference note (optional)</Label>
              <Input
                id="premium-payer-note"
                value={payerNote}
                maxLength={MAX_PREMIUM_UPGRADE_NOTE_LENGTH}
                disabled={submitMutation.isPending}
                placeholder="e.g. GCash ref. no. or sender name"
                onChange={(event) => setPayerNote(event.target.value)}
              />
            </div>

            <MarketplacePaymentProofField
              required
              disabled={submitMutation.isPending}
              value={paymentProof}
              onChange={setPaymentProof}
            />
          </div>
        ) : null}

        <DialogFooter>
          {showThanks ? (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={submitMutation.isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Submitting…
                  </>
                ) : (
                  "Submit proof of payment"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
