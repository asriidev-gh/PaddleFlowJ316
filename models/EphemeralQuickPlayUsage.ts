import mongoose, { Schema, model, models } from "mongoose";

const ephemeralQuickPlayUsageSchema = new Schema(
  {
    gameId: { type: String, required: true, trim: true, index: true },
    visitorId: { type: String, required: true, trim: true, index: true },
    ipAddress: { type: String, required: true, trim: true, maxlength: 64 },
    userAgent: { type: String, trim: true, maxlength: 500, default: "" },
    deviceCategory: {
      type: String,
      enum: ["mobile", "tablet", "desktop", "unknown"],
      default: "unknown",
      index: true,
    },
    authUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true, sparse: true },
    gameMode: { type: String, enum: ["doubles", "singles"], required: true },
    courtCount: { type: Number, required: true, min: 1 },
    playerCount: { type: Number, required: true, min: 0 },
    openPlayType: { type: String, required: true, trim: true, maxlength: 80 },
    matchingType: {
      type: String,
      enum: ["auto-balanced", "winner-loser-groups", "mixed-doubles", ""],
      default: "",
    },
  },
  { timestamps: true },
);

ephemeralQuickPlayUsageSchema.index({ createdAt: -1 });
ephemeralQuickPlayUsageSchema.index({ visitorId: 1, createdAt: -1 });
ephemeralQuickPlayUsageSchema.index({ ipAddress: 1, createdAt: -1 });

if (models.EphemeralQuickPlayUsage) {
  mongoose.deleteModel("EphemeralQuickPlayUsage");
}

export const EphemeralQuickPlayUsage = model("EphemeralQuickPlayUsage", ephemeralQuickPlayUsageSchema);
