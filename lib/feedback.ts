import { Types } from "mongoose";

import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { sendFeedbackNotificationEmail } from "@/lib/feedback-email";
import { uploadFeedbackAttachment } from "@/lib/feedback-upload";
import {
  FEEDBACK_RATE_LIMIT_MS,
  MAX_FEEDBACK_MESSAGE_LENGTH,
} from "@/lib/support-config-shared";
import { Feedback } from "@/models/Feedback";
import { User } from "@/models/User";

export type CreateFeedbackResult = {
  id: string;
  emailDelivered: boolean;
};

export async function createOrganizerFeedback(
  userId: string,
  input: {
    message: string;
    pagePath?: string;
    userAgent?: string;
    imageFile?: File | null;
  },
): Promise<CreateFeedbackResult> {
  const message = input.message.trim();
  if (!message) {
    throw new Error("Please write a short message before sending.");
  }
  if (message.length > MAX_FEEDBACK_MESSAGE_LENGTH) {
    throw new Error(`Message must be ${MAX_FEEDBACK_MESSAGE_LENGTH} characters or fewer.`);
  }

  const user = await User.findById(userId)
    .select("name email")
    .lean<{ name: string; email: string }>();
  if (!user) {
    throw new Error("Account not found.");
  }

  const recent = await Feedback.findOne({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .lean<{ createdAt?: Date }>();
  if (recent?.createdAt) {
    const elapsed = Date.now() - new Date(recent.createdAt).getTime();
    if (elapsed < FEEDBACK_RATE_LIMIT_MS) {
      throw new Error("Please wait a couple of minutes before sending more feedback.");
    }
  }

  let imageUrl = "";
  let imagePublicId = "";
  const imageFile = input.imageFile;
  if (imageFile && imageFile.size > 0) {
    if (!isCloudinaryConfigured()) {
      throw new Error("Screenshot upload is not configured on this server.");
    }
    const uploaded = await uploadFeedbackAttachment(imageFile, { userId });
    imageUrl = uploaded.imageUrl;
    imagePublicId = uploaded.imagePublicId;
  }

  const pagePath = (input.pagePath ?? "").trim().slice(0, 500);
  const userAgent = (input.userAgent ?? "").trim().slice(0, 500);

  const doc = await Feedback.create({
    userId,
    userEmail: user.email,
    userName: user.name,
    message,
    imageUrl,
    imagePublicId,
    pagePath,
    userAgent,
    emailDelivered: false,
  });

  const emailResult = await sendFeedbackNotificationEmail({
    organizerName: user.name,
    organizerEmail: user.email,
    message,
    pagePath,
    imageUrl: imageUrl || undefined,
    feedbackId: doc._id.toString(),
  });

  if (emailResult.ok) {
    doc.emailDelivered = true;
    await doc.save();
  }

  return {
    id: doc._id.toString(),
    emailDelivered: emailResult.ok,
  };
}
