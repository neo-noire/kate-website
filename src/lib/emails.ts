import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { formatPrice } from "@/lib/money";

/**
 * The texts of every email the site sends, per language. Plain text on purpose: it renders
 * everywhere and nothing here needs layout. The locale comes from the page the person was on.
 */

const BRAND = "LatinKate";

export function emailLocale(value: string | null | undefined): Locale {
  return value && hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

type Code = { otp: string; minutes: number };

const verificationCode: Record<Locale, (c: Code) => { subject: string; text: string }> = {
  en: ({ otp, minutes }) => ({
    subject: `${otp} is your ${BRAND} code`,
    text: `Your ${BRAND} verification code is ${otp}. It expires in ${minutes} minutes.\n\nIf you didn't ask for this, you can ignore this email.`,
  }),
  uk: ({ otp, minutes }) => ({
    subject: `${otp} — твій код ${BRAND}`,
    text: `Твій код підтвердження ${BRAND}: ${otp}. Він дійсний ${minutes} хвилин.\n\nЯкщо це були не ти, просто проігноруй цей лист.`,
  }),
};

const passwordResetCode: Record<Locale, (c: Code) => { subject: string; text: string }> = {
  en: ({ otp, minutes }) => ({
    subject: `${otp} is your ${BRAND} password reset code`,
    text: `Use the code ${otp} to set a new ${BRAND} password. It expires in ${minutes} minutes.\n\nIf you didn't ask to reset your password, you can ignore this email; your password stays the same.`,
  }),
  uk: ({ otp, minutes }) => ({
    subject: `${otp} — код для зміни пароля ${BRAND}`,
    text: `Введи код ${otp}, щоб встановити новий пароль ${BRAND}. Він дійсний ${minutes} хвилин.\n\nЯкщо ти не просив(ла) змінити пароль, проігноруй цей лист — пароль залишиться тим самим.`,
  }),
};

/** A one-time code for signing in or resetting a password. */
export function codeEmail(type: "forget-password" | "email-verification" | "sign-in" | "change-email", locale: Locale, code: Code) {
  return (type === "forget-password" ? passwordResetCode : verificationCode)[locale](code);
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
export function purchaseEmail(locale: Locale, p: PurchaseSummary) {
  const money = (cents: number) => formatPrice(cents, p.currency, locale);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(p.expiresAt);
  if (locale === "uk") {
    return {
      subject: `Твій курс ${p.courseTitle} відкрито`,
      text: [
        `Дякуємо за покупку! Курс «${p.courseTitle}» (${p.programTitle}, пакет ${p.tierName}) уже чекає на тебе.`,
        `Сплачено: ${money(p.amountCents)} (з них HST ${money(p.taxCents)}).`,
        `Доступ до відеоуроків діє до ${date}.`,
        `Дивитися: ${p.dashboardUrl}`,
        `Квитанцію за оплату надсилає Stripe окремим листом.`,
      ].join("\n\n"),
    };
  }
  return {
    subject: `Your ${p.courseTitle} course is ready`,
    text: [
      `Thank you for your purchase! ${p.courseTitle} (${p.programTitle}, ${p.tierName} package) is waiting for you.`,
      `Paid: ${money(p.amountCents)} (includes ${money(p.taxCents)} HST).`,
      `Your access to the video lessons lasts until ${date}.`,
      `Start watching: ${p.dashboardUrl}`,
      `Stripe sends the card receipt in a separate email.`,
    ].join("\n\n"),
  };
}

/** Tells the admins a contact message arrived; the full text is on the admin page too. */
export function contactNotificationEmail(m: { name: string; email: string; message: string; adminUrl: string }) {
  return {
    // Reply goes straight to the visitor.
    replyTo: m.email,
    subject: `New message from ${m.name} / Нове повідомлення від ${m.name}`,
    text: [`${m.name} <${m.email}> wrote:`, m.message, `Reply to ${m.email}. All messages: ${m.adminUrl}`].join("\n\n"),
  };
}
