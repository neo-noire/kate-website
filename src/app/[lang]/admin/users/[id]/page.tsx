import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { FormSection } from "@/components/admin/card-row";
import { ActionForm, TextField } from "@/components/admin/forms";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { adminEmails } from "@/lib/auth/session";
import { deactivateAccount, deleteAccount, reactivateAccount } from "@/lib/catalog/admin-actions";
import { getUserDetail } from "@/lib/catalog/admin-queries";
import { userStatus } from "@/lib/catalog/user-status";
import { localize } from "@/lib/localized";
import { formatPrice } from "@/lib/money";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("title"), robots: { index: false } };
}

export default function AdminUserPage({ params }: PageProps<"/[lang]/admin/users/[id]">) {
  return (
    <Suspense fallback={<main className="section wrap" style={{ minHeight: "60vh" }} />}>
      <UserDetail params={params} />
    </Suspense>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium break-all">{children}</span>
    </div>
  );
}

async function UserDetail({ params }: Pick<PageProps<"/[lang]/admin/users/[id]">, "params">) {
  const { id } = await params;
  await requireAdminPage(`/admin/users/${id}`);
  const user = await getUserDetail(id);
  if (!user) notFound();
  const [t, locale, format] = await Promise.all([getTranslations("admin"), getLocale(), getFormatter()]);
  const when = (value: Date) => format.dateTime(value, { dateStyle: "medium", timeStyle: "short" });
  const status = userStatus(user);
  const isAdminAccount = user.role === "admin" || adminEmails().has(user.email.toLowerCase());

  return (
    <main className="section wrap adminPage">
      <Link className="backLink" href="/admin/users">
        <ArrowLeft size={14} aria-hidden /> {t("users.back")}
      </Link>
      <div className="eyebrow">{t("eyebrow")}</div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="m-0!">{user.name}</h1>
        {user.role === "admin" && <Badge>{t("users.admin")}</Badge>}
        <Badge variant={status === "active" ? "default" : "secondary"}>{t(`users.status.${status}`)}</Badge>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <FormSection title={t("users.account")}>
          <div>
            <Row label={t("users.email")}>{user.email}</Row>
            <Row label={t("users.emailStatus")}>{user.emailVerified ? t("users.verified") : t("users.unverified")}</Row>
            <Row label={t("users.role")}>{user.role}</Row>
            <Row label={t("users.signIn")}>
              {user.providers.length ? user.providers.map((p) => (p === "credential" || p === "google" ? t(`users.method.${p}`) : p)).join(", ") : t("users.noMethods")}
            </Row>
            <Row label={t("users.signedUpLabel")}>{when(user.createdAt)}</Row>
            <Row label={t("users.lastLoginLabel")}>{user.lastLoginAt ? when(user.lastLoginAt) : t("users.never")}</Row>
          </div>
        </FormSection>

        <FormSection title={t("users.manage")}>
          {user.deletedAt ? (
            <p className="m-0 text-sm text-muted-foreground">{t("users.deletedOn", { date: when(user.deletedAt) })}</p>
          ) : isAdminAccount ? (
            <p className="m-0 text-sm text-muted-foreground">{t("users.protectedHint")}</p>
          ) : (
            <>
              {user.deactivatedAt ? (
                <div className="grid gap-3">
                  <p className="m-0 text-sm">
                    {t("users.deactivatedOn", { date: when(user.deactivatedAt) })}
                    {user.deactivationReason && (
                      <>
                        <br />
                        <span className="text-muted-foreground">{t("users.reasonLine", { reason: user.deactivationReason })}</span>
                      </>
                    )}
                  </p>
                  <ActionForm action={reactivateAccount} submitLabel={t("users.reactivate")} hidden={{ id: user.id }} />
                </div>
              ) : (
                <div className="grid gap-3">
                  <p className="m-0 text-[13px] text-muted-foreground">{t("users.deactivateHint")}</p>
                  <ActionForm action={deactivateAccount} submitLabel={t("users.deactivate")} hidden={{ id: user.id }} confirm={t("users.deactivateConfirm")} danger>
                    <TextField name="reason" label={t("users.reason")} />
                  </ActionForm>
                </div>
              )}
              <div className="grid gap-3 border-t border-border pt-4">
                <p className="m-0 text-[13px] text-muted-foreground">{t("users.deleteHint")}</p>
                <ActionForm action={deleteAccount} submitLabel={t("users.delete")} hidden={{ id: user.id }} confirm={t("users.deleteConfirm")} danger />
              </div>
            </>
          )}
        </FormSection>

        <FormSection title={t("users.purchasesTitle")}>
          {user.purchases.length ? (
            <ul className="m-0 grid list-none gap-3 p-0">
              {user.purchases.map((p) => (
                <li key={p.id} className="grid gap-0.5 text-sm">
                  <span className="font-bold">
                    {localize(p.course.title, locale)}
                    {p.tier && ` · ${localize(p.tier.name, locale)}`}
                  </span>
                  <small className="text-xs text-muted-foreground">
                    {t("users.purchaseLine", { source: p.source === "stripe" ? t("users.stripe") : t("users.grantedByHand"), status: p.status })}
                    {p.amountCents != null && ` · ${formatPrice(p.amountCents, p.currency ?? "CAD", locale)}`} · {when(p.createdAt)}
                    {p.expiresAt && ` · ${t("users.until", { date: when(p.expiresAt) })}`}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-muted-foreground">{t("users.noPurchases")}</p>
          )}
        </FormSection>

        <FormSection title={t("users.sessionsTitle")}>
          {user.sessions.length ? (
            <ul className="m-0 grid list-none gap-3 p-0">
              {user.sessions.map((s) => (
                <li key={s.id} className="grid gap-0.5 text-sm">
                  <span>{when(s.createdAt)}</span>
                  <small className="truncate text-xs text-muted-foreground">
                    {s.ipAddress ?? "—"} · {s.userAgent ?? "—"}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-muted-foreground">{t("users.noSessions")}</p>
          )}
        </FormSection>

        <FormSection title={t("users.messagesTitle")}>
          {user.messages.length ? (
            <ul className="m-0 grid list-none gap-3 p-0">
              {user.messages.map((m) => (
                <li key={m.id} className="grid gap-0.5 text-sm">
                  <small className="text-xs text-muted-foreground">{when(m.createdAt)}</small>
                  <span className="whitespace-pre-wrap">{m.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-muted-foreground">{t("users.noMessages")}</p>
          )}
        </FormSection>

        <FormSection title={t("users.promosTitle")}>
          {user.redemptions.length ? (
            <ul className="m-0 grid list-none gap-2 p-0">
              {user.redemptions.map((r) => (
                <li key={`${r.code}-${r.createdAt.toISOString()}`} className="text-sm">
                  <span className="font-mono tracking-wide">{r.code}</span>{" "}
                  <small className="text-xs text-muted-foreground">
                    {r.status} · {when(r.createdAt)}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-muted-foreground">{t("users.noPromos")}</p>
          )}
        </FormSection>
      </div>
    </main>
  );
}
