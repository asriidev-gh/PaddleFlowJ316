"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ClientErrorReporter } from "@/components/client-error-reporter";
import { DeferredClientEffects } from "@/components/deferred-client-effects";
import { ThemeManager } from "@/components/theme/theme-manager";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ClientErrorReporter>
        <ThemeManager />
        <TooltipProvider>
          {children}
          <DeferredClientEffects />
        </TooltipProvider>
      </ClientErrorReporter>
    </QueryClientProvider>
  );
}
