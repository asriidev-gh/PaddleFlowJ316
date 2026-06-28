import { v2 as cloudinary } from "cloudinary";

import { MAX_MARKETPLACE_PHOTO_BYTES } from "@/lib/marketplace-media-shared";
import { isAcceptedRegistrationPhotoType } from "@/lib/registration-photo";

export type PremiumPaymentProofUpload = {
  proofUrl: string;
  proofPublicId: string;
};

function getCloudinaryConfig() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud_name || !api_key || !api_secret) {
    return null;
  }
  return { cloud_name, api_key, api_secret };
}

export async function uploadPremiumPaymentProof(
  file: File,
  options: { userId: string },
): Promise<PremiumPaymentProofUpload> {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error("Payment proof upload is not configured. Contact support.");
  }

  if (!isAcceptedRegistrationPhotoType(file.type)) {
    throw new Error("Please use a JPG, PNG, WebP, or GIF image for payment proof.");
  }

  if (file.size > MAX_MARKETPLACE_PHOTO_BYTES) {
    throw new Error("Payment proof must be 5 MB or smaller.");
  }

  cloudinary.config(config);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const publicId = `${Date.now()}-premium-proof`;

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `paddleflow/premium-upgrades/${options.userId}`,
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
        transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto:good" }],
      },
      (error, uploadResult) => {
        if (error || !uploadResult?.secure_url || !uploadResult.public_id) {
          reject(error ?? new Error("Payment proof upload failed."));
          return;
        }
        resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        });
      },
    );
    stream.end(buffer);
  });

  return {
    proofUrl: result.secure_url,
    proofPublicId: result.public_id,
  };
}
