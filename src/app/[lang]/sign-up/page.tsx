import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth-form";
import { emailEnabled, googleEnabled } from "@/lib/auth/providers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signUp"), robots: { index: false } };
}

export default async function SignUpPage() {
  const t = await getTranslations("auth");
  return (
    <main className="section wrap authPage">
      <div className="eyebrow">{t("eyebrow")}</div>
      <h1>{t("signUpTitle")}</h1>
      <p className="sub">{t("signUpBody")}</p>
      <AuthForm mode="signUp" google={googleEnabled} emailVerification={emailEnabled} />
    </main>
  );
}
