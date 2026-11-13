import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { renderEmail } from "@/lib/email-layout";
import { formatPrice } from "@/lib/money";

/**
 * The content of every email the site sends, per language. The locale comes from the page the person
 * was on. The look lives in email-layout.ts; each email there is sent as HTML with a plain-text copy.
 */

const BRAND = "LatinKate";

export function emailLocale(value: string | null | undefined): Locale {
  return value && hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

type Code = { otp: string; minutes: number };

const verificationCode: Record<Locale, (c: Code) => { subject: string; heading: string; paragraphs: string[]; footer: string }> = {
  en: ({ otp, minutes }) => ({
    subject: `${otp} is your ${BRAND} code`,
    heading: "Your verification code",
    paragraphs: [`Enter this code to confirm your email. It expires in ${minutes} minutes.`],
    footer: "If you didn't ask for this, you can ignore this email.",
  }),
  uk: ({ otp, minutes }) => ({
    subject: `${otp} — твій код ${BRAND}`,
    heading: "Твій код підтвердження",
    paragraphs: [`Введи цей код, щоб підтвердити email. Він дійсний ${minutes} хвилин.`],
    footer: "Якщо це були не ти, просто проігноруй цей лист.",
  }),
};

const passwordResetCode: Record<Locale, (c: Code) => { subject: string; heading: string; paragraphs: string[]; footer: string }> = {
  en: ({ otp, minutes }) => ({
    subject: `${otp} is your ${BRAND} password reset code`,
    heading: "Reset your password",
    paragraphs: [`Enter this code to set a new ${BRAND} password. It expires in ${minutes} minutes.`],
    footer: "If you didn't ask to reset your password, you can ignore this email; your password stays the same.",
  }),
  uk: ({ otp, minutes }) => ({
    subject: `${otp} — код для зміни пароля ${BRAND}`,
    heading: "Зміна пароля",
    paragraphs: [`Введи цей код, щоб встановити новий пароль ${BRAND}. Він дійсний ${minutes} хвилин.`],
    footer: "Якщо ти не просив(ла) змінити пароль, проігноруй цей лист — пароль залишиться тим самим.",
  }),
};

/** A one-time code for signing in or resetting a password. */
export function codeEmail(type: "forget-password" | "email-verification" | "sign-in" | "change-email", locale: Locale, code: Code) {
  const { subject, ...content } = (type === "forget-password" ? passwordResetCode : verificationCode)[locale](code);
  return { subject, ...renderEmail({ lang: locale, code: code.otp, ...content }) };
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
      ...renderEmail({
        lang: locale,
        heading: "Дякуємо за покупку!",
        paragraphs: [`Курс «${p.courseTitle}» уже чекає на тебе. Гарного навчання!`],
        details: [
          ["Курс", p.courseTitle],
          ["Програма", p.programTitle],
          ["Пакет", p.tierName],
          ["Сплачено", `${money(p.amountCents)} (з них HST ${money(p.taxCents)})`],
          ["Доступ до", date],
        ],
        button: { label: "Дивитися уроки", url: p.dashboardUrl },
        footer: "Квитанцію за оплату надсилає Stripe окремим листом.",
      }),
    };
  }
  return {
    subject: `Your ${p.courseTitle} course is ready`,
    ...renderEmail({
      lang: locale,
      heading: "Thank you for your purchase!",
      paragraphs: [`${p.courseTitle} is waiting for you. Enjoy the lessons!`],
      details: [
        ["Course", p.courseTitle],
        ["Program", p.programTitle],
        ["Package", p.tierName],
        ["Paid", `${money(p.amountCents)} (includes ${money(p.taxCents)} HST)`],
        ["Access until", date],
      ],
      button: { label: "Start watching", url: p.dashboardUrl },
      footer: "Stripe sends the card receipt in a separate email.",
    }),
  };
}

/** Tells the admins a contact message arrived; the full text is on the admin page too. */
export function contactNotificationEmail(m: { name: string; email: string; message: string; adminUrl: string }) {
  return {
    // Reply goes straight to the visitor.
    replyTo: m.email,
    subject: `New message from ${m.name} / Нове повідомлення від ${m.name}`,
    ...renderEmail({
      lang: "en",
      heading: "New message / Нове повідомлення",
      details: [
        ["From / Від", m.name],
        ["Email", m.email],
      ],
      quote: m.message,
      button: { label: "Open admin / Відкрити адмінку", url: m.adminUrl },
      footer: `Reply to this email to answer ${m.email} directly.`,
    }),
  };
}
