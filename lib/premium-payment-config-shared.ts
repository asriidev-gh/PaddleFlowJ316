import {
  formatPremiumAnnualPrice,
  formatPremiumPaymentMethod,
  PREMIUM_ACTIVE_PAYMENT_METHODS,
  PREMIUM_ANNUAL_PRICE_PHP,
  type PremiumPaymentMethod,
} from "@/lib/premium-payment-shared";

export type PremiumPaymentMethodConfig = {
  id: PremiumPaymentMethod;
  label: string;
  instructions: string;
  qrUrl: string | null;
  configured: boolean;
};

export type PremiumPaymentConfig = {
  annualPricePhp: number;
  formattedPrice: string;
  billingPeriodLabel: string;
  methods: PremiumPaymentMethodConfig[];
};

export const PREMIUM_PUBLIC_QR_FILES: Record<PremiumPaymentMethod, string> = {
  gcash_maya: "assets/images/gcash_account.jpg",
  bdo: "premium-payment/bdo-qr.png",
  bpi: "premium-payment/bpi-qr.png",
};

export const PREMIUM_ENV_QR_KEYS: Record<PremiumPaymentMethod, string> = {
  gcash_maya: "NEXT_PUBLIC_PREMIUM_PAYMENT_GCASH_MAYA_QR_URL",
  bdo: "NEXT_PUBLIC_PREMIUM_PAYMENT_BDO_QR_URL",
  bpi: "NEXT_PUBLIC_PREMIUM_PAYMENT_BPI_QR_URL",
};

export const PREMIUM_PAYMENT_INSTRUCTIONS: Record<PremiumPaymentMethod, string> = {
  gcash_maya: "Open GCash, scan the QR code below, and pay the exact annual amount.",
  bdo: "Open your BDO app, scan the QR code below, and pay the exact annual amount.",
  bpi: "Open your BPI app, scan the QR code below, and pay the exact annual amount.",
};

export function buildPremiumPaymentConfig(
  resolveQrUrl: (method: PremiumPaymentMethod) => string | null,
) {
  const methods = PREMIUM_ACTIVE_PAYMENT_METHODS.map((id) => {
    const qrUrl = resolveQrUrl(id);
    return {
      id,
      label: formatPremiumPaymentMethod(id),
      instructions: PREMIUM_PAYMENT_INSTRUCTIONS[id],
      qrUrl,
      configured: Boolean(qrUrl),
    };
  });

  return {
    annualPricePhp: PREMIUM_ANNUAL_PRICE_PHP,
    formattedPrice: formatPremiumAnnualPrice(),
    billingPeriodLabel: "per year",
    methods,
  } satisfies PremiumPaymentConfig;
}
