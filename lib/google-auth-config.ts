function isTruthyEnvFlag(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
}

function readLoginExtrasEnv() {
  return (
    process.env.NEXT_PUBLIC_ENABLE_LOGIN_EXTRAS ??
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH
  );
}

/**
 * Login marketing extras: Google auth, demo video intro, watch-demo button, and login background.
 * Default: hidden.
 */
export function isLoginExtrasEnabled() {
  return isTruthyEnvFlag(readLoginExtrasEnv());
}

/** @deprecated Use isLoginExtrasEnabled — kept for existing imports. */
export const isGoogleAuthEnabled = isLoginExtrasEnabled;