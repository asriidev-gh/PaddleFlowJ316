import { NextResponse } from "next/server";

import { getAuthUserFromCookie } from "@/lib/auth";
import { runWithDatabase } from "@/lib/db";
import { listPremiumUpgradeRequestsForInsights } from "@/lib/premium-upgrade-requests";
import { isSuperAdmin } from "@/lib/superadmin";

export async function GET() {
  try {
    return await runWithDatabase(async () => {
      const authUser = await getAuthUserFromCookie();
      if (!authUser) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
      }
      if (!isSuperAdmin(authUser.email)) {
        return NextResponse.json({ message: "Forbidden." }, { status: 403 });
      }

      const payload = await listPremiumUpgradeRequestsForInsights();
      return NextResponse.json(payload);
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to load premium submissions.",
      },
      { status: 400 },
    );
  }
}
