import { NextResponse } from "next/server";

import { getAuthUserFromCookie } from "@/lib/auth";
import { runWithDatabase } from "@/lib/db";
import { getEphemeralQuickPlayUsageInsights } from "@/lib/ephemeral-quick-play-usage-server";
import { isSuperAdmin } from "@/lib/superadmin";

export async function GET() {
  try {
    const authUser = await getAuthUserFromCookie();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    if (!isSuperAdmin(authUser.email)) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const insights = await runWithDatabase(() => getEphemeralQuickPlayUsageInsights());
    return NextResponse.json({ insights });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to load quick play usage insights.",
      },
      { status: 400 },
    );
  }
}
