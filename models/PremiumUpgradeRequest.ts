import mongoose, { Schema } from "mongoose";

import { MAX_PREMIUM_UPGRADE_NOTE_LENGTH } from "@/lib/premium-payment-shared";

const premiumUpgradeRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    userName: { type: String, required: true, trim: true, maxlength: 120 },
    paymentMethod: {
      type: String,
      enum: ["gcash_maya", "bdo", "bpi"],
      required: true,
    },
    amountPhp: { type: Number, required: true, min: 0 },
    payerNote: { type: String, trim: true, maxlength: MAX_PREMIUM_UPGRADE_NOTE_LENGTH, default: "" },
    proofUrl: { type: String, required: true, trim: true },
    proofPublicId: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedAt: { type: Date, default: null },
    reviewedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewNote: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

premiumUpgradeRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });
premiumUpgradeRequestSchema.index({ status: 1, createdAt: -1 });

if (mongoose.models.PremiumUpgradeRequest) {
  mongoose.deleteModel("PremiumUpgradeRequest");
}

export const PremiumUpgradeRequest = mongoose.model(
  "PremiumUpgradeRequest",
  premiumUpgradeRequestSchema,
);
