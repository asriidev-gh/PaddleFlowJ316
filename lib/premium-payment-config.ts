import fs from "fs";
import path from "path";

import {
  buildPremiumPaymentConfig,
  PREMIUM_ENV_QR_KEYS,
  PREMIUM_PUBLIC_QR_FILES,
  type PremiumPaymentConfig,
} from "@/lib/premium-payment-config-shared";
import type { PremiumPaymentMethod } from "@/lib/premium-payment-shared";

export type {
  PremiumPaymentConfig,
  PremiumPaymentMethodConfig,
} from "@/lib/premium-payment-config-shared";

function resolvePublicAssetUrl(relativePath: string) {
  const fullPath = path.join(process.cwd(), "public", relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return `/${relativePath.replace(/\\/g, "/")}`;
}

function resolveServerPremiumPaymentQrUrl(method: PremiumPaymentMethod) {
  const envUrl = process.env[PREMIUM_ENV_QR_KEYS[method]]?.trim();
  if (envUrl) return envUrl;
  return resolvePublicAssetUrl(PREMIUM_PUBLIC_QR_FILES[method]);
}

export function getPremiumPaymentConfig(): PremiumPaymentConfig {
  return buildPremiumPaymentConfig(resolveServerPremiumPaymentQrUrl);
}

export function getPremiumPaymentMethodConfig(method: PremiumPaymentMethod) {
  return getPremiumPaymentConfig().methods.find((item) => item.id === method) ?? null;
}
