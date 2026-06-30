import { NextResponse } from "next/server";

import { authorizeAuthPayload, readAuthTokenPayload } from "@/lib/auth";
import { resolveClientIp } from "@/lib/client-ip";
import { runWithDatabase } from "@/lib/db";
import { ephemeralQuickPlayUsageSchema } from "@/lib/ephemeral-quick-play-usage-shared";
import { recordEphemeralQuickPlayUsage } from "@/lib/ephemeral-quick-play-usage-server";
import { formatZodError } from "@/lib/format-zod-error";

/** Public: record anonymous ephemeral quick-play session usage (no game payload). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ephemeralQuickPlayUsageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: formatZodError(parsed.error) }, { status: 400 });
    }

    const ipAddress = resolveClientIp(request);
    const userAgent =
      request.headers.get("user-agent")?.trim().slice(0, 500) ??
      parsed.data.visitorId.slice(0, 500);

    const tokenPayload = await readAuthTokenPayload();
    const authUser = tokenPayload ? await authorizeAuthPayload(tokenPayload) : null;

    return await runWithDatabase(async () => {
      const result = await recordEphemeralQuickPlayUsage({
        ...parsed.data,
        ipAddress,
        userAgent,
        authUserId: authUser?.userId ?? null,
      });

      if (!result.recorded && result.reason === "rate_limited") {
        return NextResponse.json({ message: "Too many requests." }, { status: 429 });
      }

      return NextResponse.json({ ok: true, recorded: result.recorded });
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to record usage." },
      { status: 400 },
    );
  }
}
