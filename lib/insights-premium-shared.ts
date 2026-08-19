import type {
  PremiumPaymentMethod,
  PremiumUpgradeRequestStatus,
} from "@/lib/premium-payment-shared";

export const INSIGHTS_PREMIUM_FILTERS = ["pending", "approved", "rejected", "all"] as const;
export type InsightsPremiumFilter = (typeof INSIGHTS_PREMIUM_FILTERS)[number];

export type InsightsPremiumRequestItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  paymentMethod: PremiumPaymentMethod;
  paymentMethodLabel: string;
  amountPhp: number;
  payerNote: string;
  proofUrl: string;
  status: PremiumUpgradeRequestStatus;
  statusLabel: string;
  userIsPremium: boolean;
  createdAt: string;
  reviewedAt: string | null;
};

export type InsightsPremiumRequestsPayload = {
  requests: InsightsPremiumRequestItem[];
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
};

export const INSIGHTS_PREMIUM_REVIEW_ACTIONS = ["approve", "reject", "revoke"] as const;
export type InsightsPremiumReviewAction = (typeof INSIGHTS_PREMIUM_REVIEW_ACTIONS)[number];
