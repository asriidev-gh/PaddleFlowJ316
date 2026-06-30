import packageJson from "../package.json";

const configuredAppName = process.env.NEXT_PUBLIC_APP_NAME?.trim();

/** Display name for the app (header, emails, metadata, about dialog). */
export const APP_NAME = configuredAppName || "PaddleStacks";

/** Default app logo (marketing, quick play, and unbranded shells). */
export const APP_LOGO_SRC = "/assets/images/paddlestacks_logo.png";

/** Compact brand label without spaces (player QR defaults, share cards). */
export const APP_NAME_COMPACT = APP_NAME.replace(/\s+/g, "");

export const APP_VERSION = packageJson.version;
