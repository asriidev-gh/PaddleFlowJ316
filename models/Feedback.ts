import mongoose, { Schema } from "mongoose";

import { MAX_FEEDBACK_MESSAGE_LENGTH } from "@/lib/support-config-shared";

const feedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    userName: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: MAX_FEEDBACK_MESSAGE_LENGTH },
    imageUrl: { type: String, trim: true, default: "" },
    imagePublicId: { type: String, trim: true, default: "" },
    pagePath: { type: String, trim: true, maxlength: 500, default: "" },
    userAgent: { type: String, trim: true, maxlength: 500, default: "" },
    emailDelivered: { type: Boolean, default: false },
  },
  { timestamps: true },
);

feedbackSchema.index({ userId: 1, createdAt: -1 });

if (mongoose.models.Feedback) {
  mongoose.deleteModel("Feedback");
}

export const Feedback = mongoose.model("Feedback", feedbackSchema);
