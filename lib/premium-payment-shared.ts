export const PREMIUM_ANNUAL_PRICE_PHP = 1999;

export const PREMIUM_PAYMENT_METHODS = ["gcash_maya", "bdo", "bpi"] as const;
export type PremiumPaymentMethod = (typeof PREMIUM_PAYMENT_METHODS)[number];

export const PREMIUM_UPGRADE_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;
export type PremiumUpgradeRequestStatus = (typeof PREMIUM_UPGRADE_REQUEST_STATUSES)[number];

export const MAX_PREMIUM_UPGRADE_NOTE_LENGTH = 200;

export function formatPremiumAnnualPrice() {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(PREMIUM_ANNUAL_PRICE_PHP);
}

export function formatPremiumPaymentMethod(method: PremiumPaymentMethod) {
  switch (method) {
    case "gcash_maya":
      return "GCash / Maya";
    case "bdo":
      return "BDO (bank transfer)";
    case "bpi":
      return "BPI (bank transfer)";
  }
}

export function isPremiumPaymentMethod(value: string): value is PremiumPaymentMethod {
  return (PREMIUM_PAYMENT_METHODS as readonly string[]).includes(value);
}

export function formatPremiumUpgradeRequestStatus(status: PremiumUpgradeRequestStatus) {
  switch (status) {
    case "pending":
      return "Pending review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Not approved";
  }
}
