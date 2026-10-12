import { NextResponse } from "next/server";

import { getAuthUserFromCookie } from "@/lib/auth";
import { runWithDatabase } from "@/lib/db";
import { createOrganizerFeedback } from "@/lib/feedback";

export async function POST(request: Request) {
  try {
    return await runWithDatabase(async () => {
      const authUser = await getAuthUserFromCookie();
      if (!authUser) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
      }

      const formData = await request.formData();
      const message = String(formData.get("message") ?? "");
      const pagePath = String(formData.get("pagePath") ?? "");
      const userAgent = String(formData.get("userAgent") ?? "");
      const imageEntry = formData.get("image");
      const imageFile =
        imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;

      const created = await createOrganizerFeedback(authUser.userId, {
        message,
        pagePath,
        userAgent,
        imageFile,
      });

      return NextResponse.json({
        id: created.id,
        emailDelivered: created.emailDelivered,
        message: "Thanks — we received your feedback.",
      });
    });
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Unauthorized." ? 401 : 400;
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to send feedback.",
      },
      { status },
    );
  }
}
