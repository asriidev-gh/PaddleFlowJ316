import {
  buildPremiumPaymentConfig,
  PREMIUM_ENV_QR_KEYS,
  PREMIUM_PUBLIC_QR_FILES,
  type PremiumPaymentConfig,
} from "@/lib/premium-payment-config-shared";
import type { PremiumPaymentMethod } from "@/lib/premium-payment-shared";

function resolveClientPremiumPaymentQrUrl(method: PremiumPaymentMethod) {
  const envKey = PREMIUM_ENV_QR_KEYS[method];
  const envUrl = process.env[envKey]?.trim();
  if (envUrl) return envUrl;
  return `/${PREMIUM_PUBLIC_QR_FILES[method]}`;
}

/** Instant client-side payment config — no API round trip. */
export function getClientPremiumPaymentConfig(): PremiumPaymentConfig {
  return buildPremiumPaymentConfig(resolveClientPremiumPaymentQrUrl);
}

export function getClientPremiumPaymentMethodConfig(method: PremiumPaymentMethod) {
  return getClientPremiumPaymentConfig().methods.find((item) => item.id === method) ?? null;
}
