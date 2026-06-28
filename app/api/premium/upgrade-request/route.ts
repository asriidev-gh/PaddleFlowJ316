import { NextResponse } from "next/server";

import { getAuthUserFromCookie } from "@/lib/auth";
import { runWithDatabase } from "@/lib/db";
import {
  createPremiumUpgradeRequest,
  getLatestPremiumUpgradeRequestForUser,
} from "@/lib/premium-upgrade-requests";

export async function GET() {
  try {
    return await runWithDatabase(async () => {
      const authUser = await getAuthUserFromCookie();
      if (!authUser) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
      }

      const request = await getLatestPremiumUpgradeRequestForUser(authUser.userId);
      return NextResponse.json({ request });
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load upgrade request." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    return await runWithDatabase(async () => {
      const authUser = await getAuthUserFromCookie();
      if (!authUser) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
      }

      const formData = await request.formData();
      const paymentMethod = String(formData.get("paymentMethod") ?? "");
      const payerNote = String(formData.get("payerNote") ?? "");
      const proofFile = formData.get("proof");
      if (!(proofFile instanceof File) || proofFile.size === 0) {
        return NextResponse.json({ message: "Upload proof of payment to continue." }, { status: 400 });
      }

      const created = await createPremiumUpgradeRequest(authUser.userId, {
        paymentMethod,
        payerNote,
        proofFile,
      });

      return NextResponse.json({
        request: created,
        message: "Payment proof submitted.",
      });
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to submit payment proof." },
      { status: 400 },
    );
  }
}
