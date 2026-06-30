"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  DEFAULT_THEME,
  QUICK_GAME_DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "@/lib/theme-init-script";

export { DEFAULT_THEME, QUICK_GAME_DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme-init-script";

export type AppTheme =
  | "neon"
  | "emerald"
  | "sunset"
  | "fintech"
  | "material"
  | "cupertino"
  | "cosmos"
  | "session"
  | "makati"
  | "smarthome"
  | "travel";

export const APP_THEMES: { value: AppTheme; label: string }[] = [
  { value: "makati", label: "Dark Blue Theme" },
  { value: "session", label: "Session Dark" },
  { value: "neon", label: "Neon Arena" },
  { value: "cosmos", label: "Cosmos Dark" },
  { value: "emerald", label: "Emerald Court" },
  { value: "sunset", label: "Sunset Heat" },
  { value: "fintech", label: "Fintech Pro" },
  { value: "material", label: "Material UI" },
  { value: "cupertino", label: "Apple iOS" },
  { value: "smarthome", label: "Smart Home" },
  { value: "travel", label: "Travel" },
];

export function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function persistAppTheme(theme: AppTheme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

export function isQuickGameAppPath(pathname: string) {
  return pathname === "/quick-game" || pathname === "/play" || pathname.startsWith("/play/");
}

function isValidAppTheme(theme: string | null | undefined): theme is AppTheme {
  return Boolean(theme && APP_THEMES.some((option) => option.value === theme));
}

export function resolveAppTheme(pathname?: string): AppTheme {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
    if (isValidAppTheme(saved)) return saved;
  }

  const path =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return isQuickGameAppPath(path) ? QUICK_GAME_DEFAULT_THEME : DEFAULT_THEME;
}

export function getAppTheme(): AppTheme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const fromDom = document.documentElement.getAttribute("data-theme") as AppTheme | null;
  if (isValidAppTheme(fromDom)) {
    return fromDom;
  }
  return resolveAppTheme();
}

export function useAppTheme(): AppTheme {
  const pathname = usePathname();
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME);

  useEffect(() => {
    const syncTheme = () => setTheme(getAppTheme());
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [pathname]);

  return theme;
}

export function ThemeManager() {
  const pathname = usePathname();

  useEffect(() => {
    applyTheme(resolveAppTheme(pathname));
  }, [pathname]);

  return null;
}
