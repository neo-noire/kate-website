import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CardRow, Mark, SectionHeader } from "@/components/admin/card-row";
import { FormDialog } from "@/components/admin/dialogs";
import { ActionForm, LocalizedField, TextField } from "@/components/admin/forms";
import { ItemActions } from "@/components/admin/item-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/auth/admin-page";
import {
  createProgram,
  addAdmin,
  createPromoCode,
  deleteContactMessage,
  deletePromoCode,
  removeAdmin,
  removeSubscriber,
  updatePromoCode,
} from "@/lib/catalog/admin-actions";
import { PromoFields } from "@/components/admin/promo-fields";
import { type AdminPromoCode, getAdminPrograms, getAdminUsers, getAdminPromoCodes, getContactMessages, getNewsletterSubscribers } from "@/lib/catalog/admin-queries";
import { adminEmails } from "@/lib/auth/session";
import { localize } from "@/lib/localized";
import { formatPrice } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/catalog/status";
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
  const { user: me } = await requireAdminPage("/admin");
  const [t, locale, format, programs, promoCodes, messages, subscribers, admins] = await Promise.all([
    getTranslations("admin"),
    getLocale(),
    getFormatter(),
    getAdminPrograms(),
    getAdminPromoCodes(),
    getContactMessages(),
    getNewsletterSubscribers(),
    getAdminUsers(),
  ]);
  const date = (value: Date) => format.dateTime(value, { dateStyle: "medium", timeStyle: "short" });

  return (
    <main className="section wrap adminPage">
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1>{t("title")}</h1>
      <p className="sub">{t("intro")}</p>
      <PaymentsWarning />
      <Button asChild variant="outline" className="mt-5">
        <Link href="/admin/users">{t("users.open")}</Link>
      </Button>

      <Tabs defaultValue="programs" className="mt-6">
        <TabsList>
          <TabsTrigger value="programs">
            {t("programs")} <Badge variant="secondary">{programs.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="promo">
            {t("promo.tab")} <Badge variant="secondary">{promoCodes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="messages">
            {t("inbox.messages")} <Badge variant="secondary">{messages.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="subscribers">
            {t("inbox.subscribers")} <Badge variant="secondary">{subscribers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="admins">{t("admins.tab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="mt-6">
          <SectionHeader title={t("programs")}>
            <FormDialog mode="add" variant="default" title={t("newProgram")}>
              <ActionForm action={createProgram} submitLabel={t("create")}>
                <LocalizedField name="title" label={t("fields.title")} required />
                <TextField name="slug" label={t("fields.slug")} hint={t("fields.slugHint")} required />
              </ActionForm>
            </FormDialog>
          </SectionHeader>
          {programs.length ? (
            <ul className="m-0 grid list-none gap-3 p-0">
              {programs.map((p) => {
                const title = localize(p.title, locale);
                return (
                  <CardRow key={p.id} className="group relative p-0 hover:border-muted-foreground/50">
                    <Link href={`/admin/programs/${p.id}`} className="flex flex-1 items-center gap-3.5 py-3 pr-3 pl-4">
                      <Mark>{title.charAt(0)}</Mark>
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className="flex flex-wrap items-center gap-2 font-bold">
                          {title}
                          <Badge variant={p.status === "published" ? "default" : "secondary"}>{t(STATUS_LABEL[p.status])}</Badge>
                        </span>
                        <small className="text-xs text-muted-foreground">
                          {t("courseCount", { count: p.courses.length })} · {t("tierCount", { count: p.tiers.length })}
                        </small>
                      </span>
                      <ChevronRight size={18} aria-hidden className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </CardRow>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noPrograms")}</p>
          )}
        </TabsContent>

        <TabsContent value="promo" className="mt-6">
          <PromoCodes programs={programs.map((p) => ({ id: p.id, title: localize(p.title, locale) }))} codes={promoCodes} />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <SectionHeader title={t("inbox.messages")} />
          {messages.length ? (
            <ul className="m-0 grid list-none gap-3 p-0">
              {messages.map((m) => (
                <CardRow key={m.id} className="items-start">
                  <Mark>{m.name.charAt(0).toUpperCase()}</Mark>
                  <div className="grid min-w-0 flex-1 gap-1.5">
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <b>{m.name}</b>
                      <a href={`mailto:${m.email}`} className="text-sm text-muted-foreground hover:text-foreground">
                        {m.email}
                      </a>
                      <small className="text-xs text-muted-foreground">
                        {date(m.createdAt)} · {m.locale.toUpperCase()}
                      </small>
                    </span>
                    <p className="m-0 text-sm whitespace-pre-wrap text-foreground/85">{m.message}</p>
                  </div>
                  <ItemActions id={m.id} title={m.name} deleteLabel={t("inbox.delete")} deleteAction={deleteContactMessage} />
                </CardRow>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("inbox.noMessages")}</p>
          )}
        </TabsContent>

        <TabsContent value="subscribers" className="mt-6">
          <SectionHeader title={t("inbox.subscribers")} hint={subscribers.length ? t("inbox.subscriberCount", { count: subscribers.length }) : undefined} />
          {subscribers.length ? (
            <ul className="m-0 grid list-none gap-3 p-0">
              {subscribers.map((s) => (
                <CardRow key={s.email}>
                  <Mark>{s.email.charAt(0).toUpperCase()}</Mark>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate">{s.email}</span>
                    <small className="text-xs text-muted-foreground">
                      {date(s.createdAt)} · {s.locale.toUpperCase()}
                    </small>
                  </span>
                  <ItemActions id={s.email} idField="email" title={s.email} deleteLabel={t("inbox.remove")} deleteAction={removeSubscriber} />
                </CardRow>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("inbox.noSubscribers")}</p>
          )}
        </TabsContent>
        <TabsContent value="admins" className="mt-6">
          <SectionHeader title={t("admins.title")} hint={t("admins.hint")}>
            <FormDialog mode="add" variant="default" title={t("admins.add")}>
              <ActionForm action={addAdmin} submitLabel={t("admins.add")} resetOnSuccess>
                <TextField name="email" type="email" label={t("admins.email")} hint={t("admins.emailHint")} required />
              </ActionForm>
            </FormDialog>
          </SectionHeader>
          <ul className="m-0 grid list-none gap-3 p-0">
            {[...adminEmails()].map((email) => (
              <CardRow key={email}>
                <Mark>{email.charAt(0).toUpperCase()}</Mark>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate">{email}</span>
                  <small className="text-xs text-muted-foreground">{t("admins.fromSettings")}</small>
                </span>
              </CardRow>
            ))}
            {admins.map((admin) => (
              <CardRow key={admin.id}>
                <Mark>{admin.name.charAt(0).toUpperCase()}</Mark>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate font-bold">
                    {admin.name} {admin.id === me.id && <Badge variant="secondary">{t("admins.you")}</Badge>}
                  </span>
                  <small className="text-xs text-muted-foreground">{admin.email}</small>
                </span>
                {admin.id !== me.id && <ItemActions id={admin.id} title={admin.email} deleteLabel={t("admins.remove")} deleteAction={removeAdmin} />}
              </CardRow>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </main>
  );
}

async function PromoCodes({ programs, codes }: { programs: { id: string; title: string }[]; codes: AdminPromoCode[] }) {
  const [t, format, locale] = await Promise.all([getTranslations("admin.promo"), getFormatter(), getLocale()]);
  const day = (value: Date) => format.dateTime(value, { dateStyle: "medium" });
  const now = new Date();
  const programTitle = new Map(programs.map((p) => [p.id, p.title]));

  function state(code: AdminPromoCode) {
    if (!code.active) return "off";
    if (code.startsAt && code.startsAt > now) return "scheduled";
    if (code.expiresAt && code.expiresAt <= now) return "expired";
    if (code.maxRedemptions != null && code.used >= code.maxRedemptions) return "usedUp";
    return "active";
  }

  return (
    <>
      <SectionHeader title={t("title")} hint={t("hint")}>
        <FormDialog mode="add" variant="default" title={t("new")}>
          <ActionForm action={createPromoCode} submitLabel={t("new")} resetOnSuccess>
            <PromoFields programs={programs} />
          </ActionForm>
        </FormDialog>
      </SectionHeader>
      {codes.length ? (
        <ul className="m-0 grid list-none gap-3 p-0">
          {codes.map((code) => {
            const current = state(code);
            const discount =
              code.percentOff != null
                ? t("off", { percent: code.percentOff })
                : t("fixedOff", { amount: formatPrice(code.amountOffCents ?? 0, code.currency ?? "CAD", locale) });
            const scope = code.allPrograms ? t("everywhere") : code.programIds.map((id) => programTitle.get(id)).filter(Boolean).join(", ");
            const details = [
              discount,
              scope,
              code.maxRedemptions != null ? t("usage", { used: code.used, max: code.maxRedemptions }) : t("usageOpen", { used: code.used }),
              code.startsAt && t("from", { date: day(code.startsAt) }),
              code.expiresAt && t("until", { date: day(code.expiresAt) }),
            ].filter(Boolean);
            return (
              <CardRow key={code.id} className={current === "active" ? undefined : "opacity-80"}>
                <Mark>%</Mark>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 font-bold">
                    <span className="font-mono tracking-wide">{code.code}</span>
                    <Badge variant={current === "active" ? "default" : "secondary"}>{t(`state.${current}`)}</Badge>
                  </span>
                  <small className="text-xs text-muted-foreground">{details.join(" · ")}</small>
                </div>
                <ItemActions
                  id={code.id}
                  title={code.code}
                  editLabel={t("edit")}
                  deleteLabel={t("delete")}
                  deleteAction={deletePromoCode}
                  editForm={
                    <ActionForm action={updatePromoCode} submitLabel={t("edit")} hidden={{ id: code.id }}>
                      <PromoFields programs={programs} item={code} />
                    </ActionForm>
                  }
                />
              </CardRow>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noCodes")}</p>
      )}
    </>
  );
}

/** Tells admins that checkout is off until the Stripe settings are added in Vercel. */
async function PaymentsWarning() {
  const missing = missingStripeEnv();
  if (!missing.length) return null;
  const t = await getTranslations("admin");
  return (
    <p role="status" className="mt-5 mb-0 rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-sm">
      {t("paymentsOff", { names: missing.join(", ") })}
    </p>
  );
}
