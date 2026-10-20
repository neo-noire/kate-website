"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getPathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

const CODE_LENGTH = 6;

type ErrorKey = "invalidCode" | "codeExpired" | "tooManyAttempts" | "tooManyRequests" | "generic";

function errorKey(error: { code?: string; status?: number }): ErrorKey {
  if (error.status === 429) return "tooManyRequests";
  switch (error.code) {
    case "INVALID_OTP":
      return "invalidCode";
    case "OTP_EXPIRED":
      return "codeExpired";
    case "TOO_MANY_ATTEMPTS":
      return "tooManyAttempts";
    default:
      return "generic";
  }
}

/** Asks for the 6-digit code emailed after sign-up (or a sign-in with an unverified email), then signs in. */
export function VerifyEmailStep({ email, nextPath, onChangeEmail }: { email: string; nextPath: string; onChangeEmail: () => void }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [resent, setResent] = useState(false);

  async function verify(otp: string) {
    setPending(true);
    setError(null);
    setResent(false);
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp });
    if (error) {
      setError(errorKey(error));
      setCode("");
      setPending(false);
      return;
    }
    // A full page load so the signed-in session reaches every server-rendered page.
    window.location.assign(getPathname({ href: nextPath, locale }));
  }

  async function resend() {
    setPending(true);
    setError(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
    setPending(false);
    if (error) {
      setError(errorKey(error));
      return;
    }
    setCode("");
    setResent(true);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (code.length === CODE_LENGTH) void verify(code);
  }

  return (
    <form className="formStack" onSubmit={submit}>
      <h2>{t("verify.title")}</h2>
      <p className="fieldHint">{t("verify.body", { email })}</p>
      <InputOTP
        maxLength={CODE_LENGTH}
        pattern={REGEXP_ONLY_DIGITS}
        value={code}
        onChange={setCode}
        onComplete={verify}
        disabled={pending}
        autoFocus
        aria-label={t("verify.codeLabel")}
      >
        <InputOTPGroup>
          {Array.from({ length: CODE_LENGTH }, (_, index) => (
            <InputOTPSlot key={index} index={index} className="h-12 w-11 text-lg" />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p className="formError" role="alert">
        {error ? t(`errors.${error}`) : ""}
      </p>
      {resent && (
        <p className="status" role="status">
          {t("verify.resent")}
        </p>
      )}
      <button className="btn" type="submit" disabled={pending || code.length < CODE_LENGTH}>
        {pending ? t("verify.verifying") : t("verify.submit")}
      </button>
      <p className="authSwitch">
        <button className="textButton" type="button" onClick={resend} disabled={pending}>
          {t("verify.resend")}
        </button>
        {" · "}
        <button className="textButton" type="button" onClick={onChangeEmail} disabled={pending}>
          {t("verify.changeEmail")}
        </button>
      </p>
      <p className="fieldHint">{t("verify.noEmail")}</p>
    </form>
  );
}
