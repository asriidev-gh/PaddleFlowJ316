import { isCloudinaryConfigured } from "@/lib/cloudinary";
import type {
  InsightsPremiumRequestItem,
  InsightsPremiumRequestsPayload,
  InsightsPremiumReviewAction,
} from "@/lib/insights-premium-shared";
import {
  formatPremiumPaymentMethod,
  formatPremiumUpgradeRequestStatus,
  isPremiumActivePaymentMethod,
  MAX_PREMIUM_UPGRADE_NOTE_LENGTH,
  PREMIUM_ANNUAL_PRICE_PHP,
  type PremiumPaymentMethod,
  type PremiumUpgradeRequestStatus,
} from "@/lib/premium-payment-shared";
import { getPremiumPaymentMethodConfig } from "@/lib/premium-payment-config";
import { uploadPremiumPaymentProof } from "@/lib/premium-payment-upload";
import { canUseLiveQueueing } from "@/lib/premium-access";
import { isSuperAdminUserId } from "@/lib/superadmin";
import { PremiumUpgradeRequest } from "@/models/PremiumUpgradeRequest";
import { User } from "@/models/User";

export type PremiumUpgradeRequestSummary = {
  id: string;
  paymentMethod: PremiumPaymentMethod;
  paymentMethodLabel: string;
  amountPhp: number;
  payerNote: string;
  status: PremiumUpgradeRequestStatus;
  statusLabel: string;
  createdAt: string;
  reviewedAt: string | null;
};

function serializeRequest(doc: {
  _id: { toString(): string };
  paymentMethod: PremiumPaymentMethod;
  amountPhp: number;
  payerNote?: string | null;
  status: PremiumUpgradeRequestStatus;
  createdAt?: Date;
  reviewedAt?: Date | null;
}): PremiumUpgradeRequestSummary {
  return {
    id: doc._id.toString(),
    paymentMethod: doc.paymentMethod,
    paymentMethodLabel: formatPremiumPaymentMethod(doc.paymentMethod),
    amountPhp: doc.amountPhp,
    payerNote: doc.payerNote?.trim() ?? "",
    status: doc.status,
    statusLabel: formatPremiumUpgradeRequestStatus(doc.status),
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
  };
}

export async function getLatestPremiumUpgradeRequestForUser(userId: string) {
  const doc = await PremiumUpgradeRequest.findOne({ userId })
    .sort({ createdAt: -1 })
    .lean<{
      _id: { toString(): string };
      paymentMethod: PremiumPaymentMethod;
      amountPhp: number;
      payerNote?: string | null;
      status: PremiumUpgradeRequestStatus;
      createdAt?: Date;
      reviewedAt?: Date | null;
    }>();

  return doc ? serializeRequest(doc) : null;
}

export async function createPremiumUpgradeRequest(
  userId: string,
  input: {
    paymentMethod: string;
    payerNote?: string;
    proofFile: File;
  },
) {
  if (!isPremiumActivePaymentMethod(input.paymentMethod)) {
    throw new Error("Choose a valid payment method.");
  }

  if (!isCloudinaryConfigured()) {
    throw new Error("Payment proof upload is not configured on this server.");
  }

  const user = await User.findById(userId)
    .select("name email isPremium")
    .lean<{ name: string; email: string; isPremium?: boolean }>();
  if (!user) {
    throw new Error("Account not found.");
  }

  const isSuperAdmin = await isSuperAdminUserId(userId);
  if (canUseLiveQueueing({ isPremium: user.isPremium === true, isSuperAdmin })) {
    throw new Error("Your account already has Premium access.");
  }

  const existingPending = await PremiumUpgradeRequest.findOne({
    userId,
    status: "pending",
  })
    .select("_id")
    .lean();
  if (existingPending) {
    throw new Error("You already have a payment submission waiting for review.");
  }

  const methodConfig = getPremiumPaymentMethodConfig(input.paymentMethod);
  if (!methodConfig?.configured) {
    throw new Error("This payment option is not available yet. Please try another method or contact support.");
  }

  const payerNote = input.payerNote?.trim().slice(0, MAX_PREMIUM_UPGRADE_NOTE_LENGTH) ?? "";
  const uploaded = await uploadPremiumPaymentProof(input.proofFile, { userId });

  const created = await PremiumUpgradeRequest.create({
    userId,
    userEmail: user.email,
    userName: user.name,
    paymentMethod: input.paymentMethod,
    amountPhp: PREMIUM_ANNUAL_PRICE_PHP,
    payerNote,
    proofUrl: uploaded.proofUrl,
    proofPublicId: uploaded.proofPublicId,
    status: "pending",
  });

  return serializeRequest(created);
}

type PremiumUpgradeRequestDoc = {
  _id: { toString(): string };
  userId: { toString(): string };
  userEmail: string;
  userName: string;
  paymentMethod: PremiumPaymentMethod;
  amountPhp: number;
  payerNote?: string | null;
  proofUrl: string;
  status: PremiumUpgradeRequestStatus;
  createdAt?: Date;
  reviewedAt?: Date | null;
};

function serializeInsightsRequest(
  doc: PremiumUpgradeRequestDoc,
  userIsPremium: boolean,
): InsightsPremiumRequestItem {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    userName: doc.userName,
    userEmail: doc.userEmail,
    paymentMethod: doc.paymentMethod,
    paymentMethodLabel: formatPremiumPaymentMethod(doc.paymentMethod),
    amountPhp: doc.amountPhp,
    payerNote: doc.payerNote?.trim() ?? "",
    proofUrl: doc.proofUrl,
    status: doc.status,
    statusLabel: formatPremiumUpgradeRequestStatus(doc.status),
    userIsPremium,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
  };
}

export async function listPremiumUpgradeRequestsForInsights(): Promise<InsightsPremiumRequestsPayload> {
  const docs = await PremiumUpgradeRequest.find({})
    .sort({ createdAt: -1 })
    .lean<PremiumUpgradeRequestDoc[]>();

  const userIds = [...new Set(docs.map((doc) => doc.userId.toString()))];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } })
        .select("isPremium")
        .lean<Array<{ _id: { toString(): string }; isPremium?: boolean }>>()
    : [];
  const premiumByUserId = new Map(
    users.map((user) => [user._id.toString(), user.isPremium === true] as const),
  );

  const requests = docs.map((doc) =>
    serializeInsightsRequest(doc, premiumByUserId.get(doc.userId.toString()) === true),
  );

  return {
    requests,
    counts: {
      pending: requests.filter((request) => request.status === "pending").length,
      approved: requests.filter((request) => request.status === "approved").length,
      rejected: requests.filter((request) => request.status === "rejected").length,
      total: requests.length,
    },
  };
}

export async function reviewPremiumUpgradeRequest(input: {
  requestId: string;
  action: InsightsPremiumReviewAction;
  reviewerUserId: string;
}) {
  const doc = await PremiumUpgradeRequest.findById(input.requestId);
  if (!doc) {
    throw new Error("Premium submission not found.");
  }

  if (input.action === "approve") {
    doc.status = "approved";
    doc.reviewedAt = new Date();
    doc.reviewedByUserId = input.reviewerUserId;
    await doc.save();
    await User.findByIdAndUpdate(doc.userId, { $set: { isPremium: true } });
    return { message: "Premium access granted." };
  }

  if (input.action === "reject") {
    if (doc.status !== "pending") {
      throw new Error("Only pending submissions can be marked as not approved.");
    }
    doc.status = "rejected";
    doc.reviewedAt = new Date();
    doc.reviewedByUserId = input.reviewerUserId;
    await doc.save();
    return { message: "Submission marked as not approved." };
  }

  await User.findByIdAndUpdate(doc.userId, { $set: { isPremium: false } });
  return { message: "Premium access removed." };
}
