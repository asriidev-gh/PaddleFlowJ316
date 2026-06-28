"use client";

import { useEffect } from "react";

/** Force readable light-theme tokens while the public marketing page is mounted. */
export function useMarketingLightTheme(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    document.documentElement.setAttribute("data-marketing", "light");
    return () => {
      document.documentElement.removeAttribute("data-marketing");
    };
  }, [enabled]);
}
