export type DeviceCategory = "mobile" | "tablet" | "desktop" | "unknown";

export function parseDeviceCategory(userAgent: string | null | undefined): DeviceCategory {
  const ua = userAgent?.trim().toLowerCase() ?? "";
  if (!ua) return "unknown";
  if (/ipad|tablet|kindle|playbook|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return "mobile";
  if (/windows|macintosh|linux|cros/.test(ua)) return "desktop";
  return "unknown";
}
