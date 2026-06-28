import Swal from "sweetalert2";

const SWAL_FALLBACK = {
  background: "#0f172a",
  color: "#e2e8f0",
  confirmButtonColor: "#22c55e",
  cancelButtonColor: "#ef4444",
} as const;

function readThemeCssVar(...names: string[]): string {
  if (typeof document === "undefined") return "";
  const style = getComputedStyle(document.documentElement);
  for (const name of names) {
    const value = style.getPropertyValue(name).trim();
    if (value) return value;
  }
  return "";
}

function getActiveThemeSlug(): string {
  if (typeof document === "undefined") return "neon";
  return document.documentElement.getAttribute("data-theme") ?? "neon";
}

/** SweetAlert styling derived from the active app theme (`data-theme` CSS tokens). */
export function getSwalAlertBaseOptions() {
  if (typeof document === "undefined") return { ...SWAL_FALLBACK };

  const background = readThemeCssVar("--card", "--popover", "--background");
  const color = readThemeCssVar("--card-foreground", "--foreground");
  const confirmButtonColor = readThemeCssVar("--primary");
  const cancelButtonColor = readThemeCssVar("--destructive");

  return {
    background: background || SWAL_FALLBACK.background,
    color: color || SWAL_FALLBACK.color,
    confirmButtonColor: confirmButtonColor || SWAL_FALLBACK.confirmButtonColor,
    cancelButtonColor: cancelButtonColor || SWAL_FALLBACK.cancelButtonColor,
    customClass: {
      popup: `swal-themed-popup swal-themed-popup--${getActiveThemeSlug()}`,
    },
  };
}

/** @deprecated Use getSwalAlertBaseOptions() so dialogs follow the selected theme. */
export const swalAlertBaseOptions = SWAL_FALLBACK;

export function selfQueueCheckoutMessageHtml(playerName: string) {
  return `<strong>${playerName}</strong>, you will be checked out of the queue, but your registration and match history are kept.`;
}

export async function confirmSelfQueueCheckoutSwal(playerName: string) {
  const result = await Swal.fire({
    ...getSwalAlertBaseOptions(),
    title: "Check out?",
    html: selfQueueCheckoutMessageHtml(playerName),
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, check out",
    cancelButtonText: "Cancel",
  });

  return result.isConfirmed;
}
