import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { renderEmail } from "@/lib/email-layout";
import { formatPrice } from "@/lib/money";

/**
 * The content of every email the site sends. Emails are in English only, whatever language the
 * page was in. The look lives in email-layout.ts; each email is sent as HTML with a plain-text copy.
 */

const BRAND = "LatinKate";

/** The language of the page a link in an email should open: the one the person bought or signed up in. */
export function emailLocale(value: string | null | undefined): Locale {
  return value && hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

type Code = { otp: string; minutes: number };

/** A one-time code for verifying an email, signing in or resetting a password. */
export function codeEmail(type: "forget-password" | "email-verification" | "sign-in" | "change-email", { otp, minutes }: Code) {
  const reset = type === "forget-password";
  return {
    subject: `${otp} is your ${BRAND} ${reset ? "password reset code" : "code"}`,
    ...renderEmail({
      lang: "en",
      heading: reset ? "Reset your password" : "Your verification code",
      paragraphs: [
        reset
          ? `Enter this code to set a new ${BRAND} password. It expires in ${minutes} minutes.`
          : `Enter this code to confirm your email. It expires in ${minutes} minutes.`,
      ],
      code: otp,
      footer: reset
        ? "If you didn't ask to reset your password, you can ignore this email; your password stays the same."
        : "If you didn't ask for this, you can ignore this email.",
    }),
  };
}

export type PurchaseSummary = {
  courseTitle: string;
  tierName: string;
  programTitle: string;
  amountCents: number;
  taxCents: number;
  currency: string;
  expiresAt: Date;
  dashboardUrl: string;
};

/** Confirms a paid course. Stripe sends the card receipt; this one says what was bought and until when. */
export function purchaseEmail(p: PurchaseSummary) {
  const date = new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(p.expiresAt);
  return {
    subject: `Your ${p.courseTitle} course is ready`,
    ...renderEmail({
      lang: "en",
      heading: "Thank you for your purchase!",
      paragraphs: [`${p.courseTitle} is waiting for you. Enjoy the lessons!`],
      details: [
        ["Course", p.courseTitle],
        ["Program", p.programTitle],
        ["Package", p.tierName],
        ["Paid", `${formatPrice(p.amountCents, p.currency, "en")} (includes ${formatPrice(p.taxCents, p.currency, "en")} HST)`],
        ["Access until", date],
      ],
      button: { label: "Start watching", url: p.dashboardUrl },
      footer: "Stripe sends the card receipt in a separate email.",
    }),
  };
}

/** Tells the course owner who bought what. */
export function purchaseNoticeEmail(p: PurchaseSummary, buyer: { name: string; email: string }) {
  return {
    replyTo: buyer.email,
    subject: `New purchase: ${p.courseTitle}`,
    ...renderEmail({
      lang: "en",
      heading: "New purchase",
      details: [
        ["Buyer", buyer.name],
        ["Email", buyer.email],
        ["Course", p.courseTitle],
        ["Package", p.tierName],
        ["Paid", `${formatPrice(p.amountCents, p.currency, "en")} (HST ${formatPrice(p.taxCents, p.currency, "en")})`],
      ],
      footer: `Reply to this email to write to ${buyer.email} directly.`,
    }),
  };
}

/** Tells the admins a contact message arrived; the full text is on the admin page too. */
export function contactNotificationEmail(m: { name: string; email: string; message: string; adminUrl: string }) {
  return {
    // Reply goes straight to the visitor.
    replyTo: m.email,
    subject: `New message from ${m.name}`,
    ...renderEmail({
      lang: "en",
      heading: "New message",
      details: [
        ["From", m.name],
        ["Email", m.email],
      ],
      quote: m.message,
      button: { label: "Open admin", url: m.adminUrl },
      footer: `Reply to this email to answer ${m.email} directly.`,
    }),
  };
}
