export const SAVE_QUICK_PLAY_POST_AUTH_PATH = "/my-games";

export function isSaveQuickPlaySearchParam(
  searchParams: Pick<URLSearchParams, "get">,
) {
  return searchParams.get("saveQuickPlay") === "1";
}

export function resolvePostAuthDestination(options: {
  saveQuickPlay?: boolean;
  returnTo?: string | null;
  defaultPath?: string;
}) {
  const defaultPath = options.defaultPath ?? "/";

  if (options.saveQuickPlay) {
    return SAVE_QUICK_PLAY_POST_AUTH_PATH;
  }

  const returnTo = options.returnTo?.trim();
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }

  return defaultPath;
}
