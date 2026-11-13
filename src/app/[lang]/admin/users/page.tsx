import { ArrowLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CardRow, Mark, SectionHeader } from "@/components/admin/card-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { getUsersPage, USERS_PAGE_SIZE } from "@/lib/catalog/admin-queries";
import { userStatus } from "@/lib/catalog/user-status";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("title"), robots: { index: false } };
}

export default function AdminUsersPage({ searchParams }: PageProps<"/[lang]/admin/users">) {
  return (
    <Suspense fallback={<main className="section wrap" style={{ minHeight: "60vh" }} />}>
      <Users searchParams={searchParams} />
    </Suspense>
  );
}

async function Users({ searchParams }: Pick<PageProps<"/[lang]/admin/users">, "searchParams">) {
  await requireAdminPage("/admin/users");
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const page = Math.max(1, Math.floor(Number(typeof params.page === "string" ? params.page : 1)) || 1);
  const [t, format, { rows, total }] = await Promise.all([getTranslations("admin"), getFormatter(), getUsersPage(query, page)]);
  const pages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const day = (value: Date) => format.dateTime(value, { dateStyle: "medium" });
  const pageHref = (target: number) => ({ pathname: "/admin/users" as const, query: { ...(query && { q: query }), page: target } });

  return (
    <main className="section wrap adminPage">
      <Link className="backLink" href="/admin">
        <ArrowLeft size={14} aria-hidden /> {t("title")}
      </Link>
      <div className="eyebrow">{t("eyebrow")}</div>
      <SectionHeader title={t("users.title")} hint={`${t("users.hint")} · ${t("users.count", { count: total })}`}>
        <form className="flex gap-2" role="search">
          <Input name="q" defaultValue={query} placeholder={t("users.search")} aria-label={t("users.search")} className="w-64" autoComplete="off" />
          <Button type="submit" variant="outline">
            {t("users.searchButton")}
          </Button>
        </form>
      </SectionHeader>

      {rows.length ? (
        <ul className="m-0 grid list-none gap-3 p-0">
          {rows.map((u) => {
            const status = userStatus(u);
            return (
              <CardRow key={u.id} className="group relative p-0 hover:border-muted-foreground/50">
                <Link href={`/admin/users/${u.id}`} className="flex flex-1 items-center gap-3.5 py-3 pr-3 pl-4">
                  <Mark>{u.name.charAt(0).toUpperCase()}</Mark>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex flex-wrap items-center gap-2 font-bold">
                      <span className="truncate">{u.name}</span>
                      {u.role === "admin" && <Badge>{t("users.admin")}</Badge>}
                      {status !== "active" && <Badge variant="secondary">{t(`users.status.${status}`)}</Badge>}
                    </span>
                    <small className="truncate text-xs text-muted-foreground">{u.email}</small>
                    <small className="text-xs text-muted-foreground">
                      {t("users.signedUp", { date: day(u.createdAt) })} · {u.lastLoginAt ? t("users.lastLogin", { date: day(u.lastLoginAt) }) : t("users.never")} ·{" "}
                      {t("users.purchases", { count: u.purchases })}
                    </small>
                  </span>
                  <ChevronRight size={18} aria-hidden className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardRow>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("users.empty")}</p>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-between gap-3" aria-label={t("users.title")}>
          {page > 1 ? (
            <Button asChild variant="outline">
              <Link href={pageHref(page - 1)}>{t("users.previous")}</Link>
            </Button>
          ) : (
            <span />
          )}
          <small className="text-muted-foreground">{t("users.page", { page, pages })}</small>
          {page < pages ? (
            <Button asChild variant="outline">
              <Link href={pageHref(page + 1)}>{t("users.next")}</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
