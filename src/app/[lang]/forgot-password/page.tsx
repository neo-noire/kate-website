import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPassword } from "@/components/forgot-password";
import { Link } from "@/i18n/navigation";
import { emailEnabled } from "@/lib/auth/providers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("reset.title"), robots: { index: false } };
}

/** Password reset. Needs the email provider; until it is connected the page says how to get help. */
export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <main className="section wrap authPage">
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1>{t("reset.title")}</h1>
      <p className="sub">{t("reset.body")}</p>
      {emailEnabled ? (
        <ForgotPassword />
      ) : (
        <>
          <p className="legalDraft" role="status">
            {t("reset.unavailable")}
          </p>
          <p className="authSwitch">
            <Link href="/sign-in">{t("reset.backToSignIn")}</Link>
          </p>
        </>
      )}
    </main>
  );
}
