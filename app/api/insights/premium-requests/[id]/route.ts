import { NextResponse } from "next/server";

import { getAuthUserFromCookie } from "@/lib/auth";
import { runWithDatabase } from "@/lib/db";
import {
  INSIGHTS_PREMIUM_REVIEW_ACTIONS,
  type InsightsPremiumReviewAction,
} from "@/lib/insights-premium-shared";
import { reviewPremiumUpgradeRequest } from "@/lib/premium-upgrade-requests";
import { isSuperAdmin } from "@/lib/superadmin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await runWithDatabase(async () => {
      const authUser = await getAuthUserFromCookie();
      if (!authUser) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
      }
      if (!isSuperAdmin(authUser.email)) {
        return NextResponse.json({ message: "Forbidden." }, { status: 403 });
      }

      const { id } = await params;
      const body = (await request.json()) as { action?: string };
      const action = body?.action;
      if (
        !action ||
        !(INSIGHTS_PREMIUM_REVIEW_ACTIONS as readonly string[]).includes(action)
      ) {
        return NextResponse.json(
          { message: "Provide action: approve, reject, or revoke." },
          { status: 400 },
        );
      }

      const result = await reviewPremiumUpgradeRequest({
        requestId: id,
        action: action as InsightsPremiumReviewAction,
        reviewerUserId: authUser.userId,
      });

      return NextResponse.json(result);
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update premium submission.",
      },
      { status: 400 },
    );
  }
}
