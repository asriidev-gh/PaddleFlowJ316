"use client";

import { usePathname } from "next/navigation";

import { useAuthMe } from "@/hooks/use-auth-me";
import { APP_NAME, APP_VERSION } from "@/lib/app-config";
import { shouldHideAppFooter } from "@/lib/app-shell";

export function AppFooter() {
  const pathname = usePathname();
  const { data: authData } = useAuthMe();

  if (shouldHideAppFooter(pathname, Boolean(authData?.user))) {
    return null;
  }

  return (
    <footer className="app-footer mt-auto border-t border-border/60 bg-muted/20 px-6 py-4 text-center text-xs text-muted-foreground">
      <p>
        {APP_NAME} v{APP_VERSION}
      </p>
    </footer>
  );
}
