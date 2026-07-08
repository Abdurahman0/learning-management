export type PremiumPaymentConfig = {
  price: string;
  currency: string;
  period: string;
  telegramUrl: string;
  telegramLabel: string;
  features: string[];
};

export const DEFAULT_PREMIUM_CONFIG: PremiumPaymentConfig = {
  price: "99 000",
  currency: "UZS",
  period: "oy",
  telegramUrl: "https://t.me/+U1YftX0MkDgzOGNi",
  telegramLabel: "Telegramda bog'lanish",
  features: [
    "Barcha premium reading testlari",
    "Barcha premium listening testlari",
    "Premium marathon dasturlari",
    "Batafsil javob izohlari",
    "Ustuvor qo'llab-quvvatlash",
  ],
};

export const PREMIUM_PAYMENT_STORAGE_KEY = "premium_payment_config";

export function loadPremiumConfig(): PremiumPaymentConfig {
  if (typeof window === "undefined") return DEFAULT_PREMIUM_CONFIG;
  try {
    const raw = localStorage.getItem(PREMIUM_PAYMENT_STORAGE_KEY);
    if (!raw) return DEFAULT_PREMIUM_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PremiumPaymentConfig>;
    return {
      price: parsed.price ?? DEFAULT_PREMIUM_CONFIG.price,
      currency: parsed.currency ?? DEFAULT_PREMIUM_CONFIG.currency,
      period: parsed.period ?? DEFAULT_PREMIUM_CONFIG.period,
      telegramUrl: parsed.telegramUrl ?? DEFAULT_PREMIUM_CONFIG.telegramUrl,
      telegramLabel: parsed.telegramLabel ?? DEFAULT_PREMIUM_CONFIG.telegramLabel,
      features: Array.isArray(parsed.features) && parsed.features.length > 0
        ? parsed.features
        : DEFAULT_PREMIUM_CONFIG.features,
    };
  } catch {
    return DEFAULT_PREMIUM_CONFIG;
  }
}

export function savePremiumConfig(config: PremiumPaymentConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREMIUM_PAYMENT_STORAGE_KEY, JSON.stringify(config));
}
