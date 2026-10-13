/** Currencies an admin can price tiers in. The business is Canadian, so CAD comes first. */
export const CURRENCIES = ["CAD", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Formats a price in minor units (cents), dropping ".00" for whole amounts. */
export function formatPrice(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** "39", "39.5" or "39,50" to 3900 / 3950; null for anything that isn't a price. */
export function parsePriceToCents(input: string): number | null {
  const value = input.trim().replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) return null;
  return Math.round(Number(value) * 100);
}

/** Ontario HST. Prices on the site include it; checkout charges exactly the price shown. */
export const HST_RATE = 0.13;

/** Splits a tax-inclusive price into the amount before tax and the HST it contains. */
export function hstBreakdown(totalCents: number) {
  const beforeTax = Math.round(totalCents / (1 + HST_RATE));
  return { beforeTax, hst: totalCents - beforeTax };
}
