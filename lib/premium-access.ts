type PremiumAccessUser = {
  isPremium?: boolean;
  isSuperAdmin?: boolean;
} | null | undefined;

/** Premium (or superadmin) accounts unlock live queueing and owner hub tools. */
export function hasPremiumAccess(user: PremiumAccessUser) {
  return Boolean(user?.isPremium || user?.isSuperAdmin);
}

/** Live queueing open play is limited to premium (or superadmin) accounts. */
export function canUseLiveQueueing(user: PremiumAccessUser) {
  return hasPremiumAccess(user);
}

/** Registered players, My Club, and Marketplace require premium. */
export function canUseOwnerHubTools(user: PremiumAccessUser) {
  return hasPremiumAccess(user);
}
