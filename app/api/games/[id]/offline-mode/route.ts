import { NextResponse } from "next/server";
import { z } from "zod";

import { getOperatorAuthUser } from "@/lib/game-actions";
import {
  enterOfflineMode,
  getOfflineModeStatus,
  syncOfflineModeToMongo,
} from "@/lib/offline-game/mode";

const bodySchema = z.object({
  action: z.enum(["enter", "sync", "status"]),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: gameId } = await params;
    const authUser = await getOperatorAuthUser(gameId);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const status = await getOfflineModeStatus(gameId);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load offline mode status." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: gameId } = await params;
    const authUser = await getOperatorAuthUser(gameId);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid offline mode request." }, { status: 400 });
    }

    if (parsed.data.action === "status") {
      const status = await getOfflineModeStatus(gameId);
      return NextResponse.json(status);
    }

    if (parsed.data.action === "enter") {
      const snapshot = await enterOfflineMode(gameId, authUser.userId);
      return NextResponse.json({
        message:
          "Offline mode enabled. The local JSON snapshot is now the source of truth for this game.",
        status: await getOfflineModeStatus(gameId),
        savedAt: snapshot.savedAt,
      });
    }

    const result = await syncOfflineModeToMongo(gameId, authUser.userId);
    return NextResponse.json({
      message: "Offline changes synced to MongoDB. Online mode restored.",
      result,
      status: await getOfflineModeStatus(gameId),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update offline mode." },
      { status: 400 },
    );
  }
}
