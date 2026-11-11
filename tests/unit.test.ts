import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/next-path";
import { validateEnv } from "@/lib/env";
import { formatPrice, parsePriceToCents, withHst } from "@/lib/money";
import { normalizePromoCode, promoDiscount } from "@/lib/promo";
import { parseYouTubeId } from "@/lib/youtube";

describe("money", () => {
  it("adds 13% HST on top and rounds to the cent", () => {
    expect(withHst(3900)).toEqual({ beforeTax: 3900, hst: 507, total: 4407 });
    expect(withHst(0)).toEqual({ beforeTax: 0, hst: 0, total: 0 });
    expect(withHst(1)).toEqual({ beforeTax: 1, hst: 0, total: 1 });
  });
  it("parses admin prices", () => {
    expect(parsePriceToCents("39")).toBe(3900);
    expect(parsePriceToCents("39,50")).toBe(3950);
    expect(parsePriceToCents("39.5")).toBe(3950);
    expect(parsePriceToCents("-1")).toBeNull();
    expect(parsePriceToCents("39.999")).toBeNull();
    expect(parsePriceToCents("abc")).toBeNull();
  });
  it("formats whole amounts without cents", () => {
    expect(formatPrice(4407, "CAD", "en")).toBe("$44.07");
    expect(formatPrice(3900, "CAD", "en")).toBe("$39");
  });
});

describe("promo codes", () => {
  it("never discounts more than the price", () => {
    expect(promoDiscount({ percentOff: 10, amountOffCents: null }, 3900)).toBe(390);
    expect(promoDiscount({ percentOff: 100, amountOffCents: null }, 3900)).toBe(3900);
    expect(promoDiscount({ percentOff: null, amountOffCents: 5000 }, 3900)).toBe(3900);
    expect(promoDiscount({ percentOff: null, amountOffCents: -5 }, 3900)).toBe(0);
  });
  it("normalizes case and whitespace", () => {
    expect(normalizePromoCode("  kate10 ")).toBe("KATE10");
  });
});

describe("youtube ids", () => {
  it("accepts the link shapes admins paste", () => {
    for (const input of [
      "dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "youtube.com/live/dQw4w9WgXcQ",
    ]) {
      expect(parseYouTubeId(input)).toBe("dQw4w9WgXcQ");
    }
  });
  it("rejects anything else", () => {
    expect(parseYouTubeId("https://vimeo.com/123")).toBeNull();
    expect(parseYouTubeId("https://evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeId("javascript:alert(1)")).toBeNull();
  });
});

describe("post sign-in redirect", () => {
  it("only allows same-site paths", () => {
    expect(safeNextPath("/programs/x/y")).toBe("/programs/x/y");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
  });
});

describe("environment validation", () => {
  const base = { DATABASE_URL: "postgres://u:p@h/db", BETTER_AUTH_SECRET: "x".repeat(32) };

  it("accepts a minimal setup", () => {
    expect(() => validateEnv(base)).not.toThrow();
  });
  it("requires EMAIL_FROM with RESEND_API_KEY", () => {
    expect(() => validateEnv({ ...base, RESEND_API_KEY: "re_x" })).toThrow(/EMAIL_FROM/);
    expect(() => validateEnv({ ...base, RESEND_API_KEY: "re_x", EMAIL_FROM: "LatinKate <hi@example.com>" })).not.toThrow();
  });
  it("refuses a test sender and a test Stripe key in production", () => {
    const prod = { ...base, VERCEL_ENV: "production" };
    expect(() => validateEnv({ ...prod, RESEND_API_KEY: "re_x", EMAIL_FROM: "onboarding@resend.dev" })).toThrow(/resend\.dev/);
    expect(() => validateEnv({ ...prod, STRIPE_SECRET_KEY: "sk_test_1", STRIPE_WEBHOOK_SECRET: "whsec_1" })).toThrow(/live key/);
    expect(() => validateEnv({ ...prod, STRIPE_SECRET_KEY: "sk_live_1", STRIPE_WEBHOOK_SECRET: "whsec_1" })).not.toThrow();
  });
  it("requires Stripe and Google settings in pairs", () => {
    expect(() => validateEnv({ ...base, STRIPE_SECRET_KEY: "sk_test_1" })).toThrow(/set together/);
    expect(() => validateEnv({ ...base, GOOGLE_CLIENT_ID: "id" })).toThrow(/set together/);
  });
  it("lists every problem at once", () => {
    expect(() => validateEnv({ DATABASE_URL: "mysql://x", BETTER_AUTH_SECRET: "short", ADMIN_EMAILS: "not-an-email" })).toThrow(
      /DATABASE_URL[\s\S]*BETTER_AUTH_SECRET[\s\S]*ADMIN_EMAILS/,
    );
  });
});
