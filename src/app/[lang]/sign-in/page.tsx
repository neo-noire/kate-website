import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth-form";
import { emailEnabled, googleEnabled } from "@/lib/auth/providers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signIn"), robots: { index: false } };
}

export default async function SignInPage() {
  const t = await getTranslations("auth");
  return (
    <main className="section wrap authPage">
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1>{t("signInTitle")}</h1>
      <p className="sub">{t("signInBody")}</p>
      <AuthForm mode="signIn" google={googleEnabled} emailVerification={emailEnabled} />
    </main>
  );
}
