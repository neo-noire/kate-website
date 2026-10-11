import Link from "next/link";
import { getDictionary } from "@/i18n/server";

export default async function NotFound() {
  const { locale, dict } = await getDictionary();
  return (
    <main className="section wrap">
      <div className="eyebrow">404</div>
      <h1 style={{ fontSize: 42, letterSpacing: -1.7, margin: "12px 0 24px" }}>{dict.notFound.title}</h1>
      <Link className="btn outline" href={`/${locale}`}>
        {dict.notFound.back}
      </Link>
    </main>
  );
}
