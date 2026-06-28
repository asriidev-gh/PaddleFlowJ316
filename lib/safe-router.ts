type RouterLike = {
  replace: (href: string) => void;
  push: (href: string) => void;
};

/** Client navigation with a full-page fallback when the App Router is not ready yet. */
export function safeRouterReplace(router: RouterLike, href: string) {
  try {
    router.replace(href);
  } catch {
    window.location.replace(href);
  }
}

export function safeRouterPush(router: RouterLike, href: string) {
  try {
    router.push(href);
  } catch {
    window.location.assign(href);
  }
}
