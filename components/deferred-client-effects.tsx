"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { AppToaster } from "@/components/app-toaster";

const CompleteEphemeralQuickGameTransfer = dynamic(
  () =>
    import("@/components/play/complete-ephemeral-quick-game-transfer").then(
      (mod) => mod.CompleteEphemeralQuickGameTransfer,
    ),
  { ssr: false },
);

/** Mount router-touching globals only after the App Router has initialized. */
export function DeferredClientEffects() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <>
      <CompleteEphemeralQuickGameTransfer />
      <AppToaster />
    </>
  );
}
