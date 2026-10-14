import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ActionForm, LocalizedField, TextField } from "@/components/admin/forms";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { createProgram, deleteContactMessage, removeSubscriber } from "@/lib/catalog/admin-actions";
import { getAdminPrograms, getContactMessages, getNewsletterSubscribers } from "@/lib/catalog/admin-queries";
import { localize } from "@/lib/localized";
import { missingStripeEnv } from "@/lib/stripe/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("title"), robots: { index: false } };
}

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="section wrap" style={{ minHeight: "60vh" }} />}>
      <AdminHome />
    </Suspense>
  );
}

async function AdminHome() {
  await requireAdminPage("/admin");
  const [t, locale, format, programs, messages, subscribers] = await Promise.all([
    getTranslations("admin"),
    getLocale(),
    getFormatter(),
    getAdminPrograms(),
    getContactMessages(),
    getNewsletterSubscribers(),
  ]);
  const date = (value: Date) => format.dateTime(value, { dateStyle: "medium", timeStyle: "short" });

  return (
    <main className="section wrap adminPage">
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1>{t("title")}</h1>
      <p className="sub">{t("intro")}</p>
      <PaymentsWarning />

      <section className="adminCard">
        <h2>{t("programs")}</h2>
        {programs.length ? (
          <ul className="adminList">
            {programs.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/programs/${p.id}`}>{localize(p.title, locale)}</Link>
                <span className={`badge${p.published ? " live" : ""}`}>{p.published ? t("published") : t("draft")}</span>
                <small>
                  {t("courseCount", { count: p.courses.length })} · {t("tierCount", { count: p.tiers.length })}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="fine">{t("noPrograms")}</p>
        )}
      </section>

      <section className="adminCard">
        <h2>{t("newProgram")}</h2>
        <ActionForm action={createProgram} submitLabel={t("create")}>
          <LocalizedField name="title" label={t("fields.title")} required />
          <TextField name="slug" label={t("fields.slug")} hint={t("fields.slugHint")} required />
        </ActionForm>
      </section>

      <section className="adminCard">
        <h2>{t("inbox.messages")}</h2>
        {messages.length ? (
          <ul className="adminList inbox">
            {messages.map((m) => (
              <li key={m.id}>
                <span>
                  <b>{m.name}</b> <a href={`mailto:${m.email}`}>{m.email}</a>
                </span>
                <small>
                  {date(m.createdAt)} · {m.locale.toUpperCase()}
                </small>
                <p className="inboxMessage">{m.message}</p>
                <ActionForm
                  action={deleteContactMessage}
                  submitLabel={t("inbox.delete")}
                  confirm={t("confirmDelete")}
                  danger
                  hidden={{ id: m.id }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="fine">{t("inbox.noMessages")}</p>
        )}
      </section>

      <section className="adminCard">
        <h2>{t("inbox.subscribers")}</h2>
        {subscribers.length ? (
          <>
            <p className="fine">{t("inbox.subscriberCount", { count: subscribers.length })}</p>
            <ul className="adminList">
              {subscribers.map((s) => (
                <li key={s.email}>
                  <span>{s.email}</span>
                  <small>
                    {date(s.createdAt)} · {s.locale.toUpperCase()}
                  </small>
                  <ActionForm
                    action={removeSubscriber}
                    submitLabel={t("inbox.remove")}
                    confirm={t("confirmDelete")}
                    danger
                    hidden={{ email: s.email }}
                  />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="fine">{t("inbox.noSubscribers")}</p>
        )}
      </section>
    </main>
  );
}

/** Tells admins that checkout is off until the Stripe settings are added in Vercel. */
async function PaymentsWarning() {
  const missing = missingStripeEnv();
  if (!missing.length) return null;
  const t = await getTranslations("admin");
  return (
    <p className="legalDraft" role="status">
      {t("paymentsOff", { names: missing.join(", ") })}
    </p>
  );
}
