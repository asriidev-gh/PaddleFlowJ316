import { NextResponse } from "next/server";

import { getAuthUserFromCookie } from "@/lib/auth";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getPremiumPaymentConfig } from "@/lib/premium-payment-config";

export async function GET() {
  const authUser = await getAuthUserFromCookie();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const config = getPremiumPaymentConfig();
  return NextResponse.json({
    ...config,
    proofUploadConfigured: isCloudinaryConfigured(),
  });
}
