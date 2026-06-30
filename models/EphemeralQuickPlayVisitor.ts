import mongoose, { Schema, model, models } from "mongoose";

const ephemeralQuickPlayVisitorSchema = new Schema(
  {
    visitorId: { type: String, required: true, unique: true, trim: true },
    sessionCount: { type: Number, required: true, default: 0, min: 0 },
    firstSeenAt: { type: Date, required: true, default: () => new Date() },
    lastSeenAt: { type: Date, required: true, default: () => new Date() },
    lastIpAddress: { type: String, trim: true, maxlength: 64, default: "" },
    lastUserAgent: { type: String, trim: true, maxlength: 500, default: "" },
    lastDeviceCategory: {
      type: String,
      enum: ["mobile", "tablet", "desktop", "unknown"],
      default: "unknown",
    },
    authUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

ephemeralQuickPlayVisitorSchema.index({ sessionCount: -1, lastSeenAt: -1 });
ephemeralQuickPlayVisitorSchema.index({ lastSeenAt: -1 });

if (models.EphemeralQuickPlayVisitor) {
  mongoose.deleteModel("EphemeralQuickPlayVisitor");
}

export const EphemeralQuickPlayVisitor = model(
  "EphemeralQuickPlayVisitor",
  ephemeralQuickPlayVisitorSchema,
);
