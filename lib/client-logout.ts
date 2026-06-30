import type { QueryClient } from "@tanstack/react-query";

import { authMeQueryKey } from "@/hooks/use-auth-me";
import { logoutAccount } from "@/lib/logout-action";
import { clearBrowserSessionsOnLogout } from "@/lib/logout-session-cleanup";

export function clearAuthMeClientCache(queryClient: QueryClient) {
  queryClient.setQueryData(authMeQueryKey(), { user: null });
}

export function performClientLogout(queryClient: QueryClient) {
  clearBrowserSessionsOnLogout();
  clearAuthMeClientCache(queryClient);
  void logoutAccount();
}
