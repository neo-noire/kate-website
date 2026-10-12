import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ActionForm, LocalizedField, TextField } from "@/components/admin/forms";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { createProgram } from "@/lib/catalog/admin-actions";
import { getAdminPrograms } from "@/lib/catalog/admin-queries";
import { localize } from "@/lib/localized";

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
  const [t, locale, programs] = await Promise.all([getTranslations("admin"), getLocale(), getAdminPrograms()]);

  return (
    <main className="section wrap adminPage">
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1>{t("title")}</h1>
      <p className="sub">{t("intro")}</p>

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
    </main>
  );
}
