import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/next-path";
import { contactNotificationEmail, codeEmail } from "@/lib/emails";
import { envWarnings, validateEnv } from "@/lib/env";
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
  it("only warns about a test Stripe key in production", () => {
    const prod = { ...base, VERCEL_ENV: "production" };
    const testKey = { ...prod, STRIPE_SECRET_KEY: "sk_test_1", STRIPE_WEBHOOK_SECRET: "whsec_1" };
    expect(envWarnings(validateEnv(testKey))).toEqual([expect.stringMatching(/test key/)]);
    expect(envWarnings(validateEnv({ ...testKey, STRIPE_SECRET_KEY: "rk_live_1" }))).toEqual([]);
  });
  it("accepts secret and restricted keys, not publishable ones", () => {
    const stripe = (key: string) => ({ ...base, STRIPE_SECRET_KEY: key, STRIPE_WEBHOOK_SECRET: "whsec_1" });
    expect(() => validateEnv(stripe("rk_test_1"))).not.toThrow();
    expect(() => validateEnv(stripe("pk_test_1"))).toThrow(/publishable/);
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

describe("emails", () => {
  it("escapes what visitors write, and keeps it readable in the plain-text copy", () => {
    const email = contactNotificationEmail({ name: "Anna", email: "a@example.com", message: "<script>alert(1)</script>", adminUrl: "https://x.test/admin" });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.text).toContain("<script>alert(1)</script>");
    expect(email.replyTo).toBe("a@example.com");
  });
  it("shows the code in both versions", () => {
    const email = codeEmail("email-verification", "en", { otp: "482913", minutes: 10 });
    expect(email.subject).toContain("482913");
    expect(email.html).toContain("482913");
    expect(email.text).toContain("482913");
  });
});
