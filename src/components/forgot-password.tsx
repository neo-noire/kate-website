"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { getPathname, Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { useLocalizedValidation } from "@/lib/validation";

const CODE_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;

type ErrorKey = "invalidCode" | "codeExpired" | "tooManyAttempts" | "tooManyRequests" | "passwordTooShort" | "generic";

function errorKey(error: { code?: string; status?: number }): ErrorKey {
  if (error.status === 429) return "tooManyRequests";
  switch (error.code) {
    case "INVALID_OTP":
      return "invalidCode";
    case "OTP_EXPIRED":
      return "codeExpired";
    case "TOO_MANY_ATTEMPTS":
      return "tooManyAttempts";
    case "PASSWORD_TOO_SHORT":
      return "passwordTooShort";
    default:
      return "generic";
  }
}

/**
 * Password reset in two steps: ask for the account email, then enter the emailed 6-digit code
 * with a new password. The request step answers the same way whether or not the email exists.
 */
export function ForgotPassword() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const validation = useLocalizedValidation();
  const ids = { email: useId(), password: useId() };
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [resent, setResent] = useState(false);

  async function request(address: string) {
    setPending(true);
    setError(null);
    setResent(false);
    const { error } = await authClient.emailOtp.requestPasswordReset({ email: address });
    setPending(false);
    if (error) {
      setError(errorKey(error));
      return;
    }
    setCode("");
    if (email) setResent(true);
    setEmail(address);
  }

  function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void request(String(new FormData(event.currentTarget).get("email")).trim());
  }

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || code.length < CODE_LENGTH) return;
    const password = String(new FormData(event.currentTarget).get("password"));
    setPending(true);
    setError(null);
    const { error } = await authClient.emailOtp.resetPassword({ email, otp: code, password });
    if (error) {
      setError(errorKey(error));
      if (error.code !== "PASSWORD_TOO_SHORT") setCode("");
      setPending(false);
      return;
    }
    // Password changed; Better Auth signed out every other session. Send them to sign in.
    window.location.assign(getPathname({ href: { pathname: "/sign-in", query: { reset: "done" } }, locale }));
  }

  if (!email) {
    return (
      <form className="grid gap-4" onSubmit={submitEmail} {...validation}>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.email}>{t("email")}</Label>
          <Input id={ids.email} name="email" type="email" autoComplete="email" required className="h-11" />
        </div>
        <p className="formError" role="alert">
          {error ? t(`errors.${error}`) : ""}
        </p>
        <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
          {pending ? t("reset.sending") : t("reset.sendCode")}
        </Button>
        <p className="authSwitch">
          <Link href="/sign-in">{t("reset.backToSignIn")}</Link>
        </p>
      </form>
    );
  }

  return (
    <form className="formStack" onSubmit={submitReset} {...validation}>
      <p className="fieldHint">{t("reset.codeSent", { email })}</p>
      <InputOTP
        maxLength={CODE_LENGTH}
        pattern={REGEXP_ONLY_DIGITS}
        value={code}
        onChange={setCode}
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
      <div className="grid gap-1.5">
        <Label htmlFor={ids.password}>{t("reset.newPassword")}</Label>
        <Input
          id={ids.password}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={128}
          required
          aria-describedby="password-hint"
          className="h-11"
        />
        <small id="password-hint" className="text-xs text-muted-foreground">
          {t("passwordHint")}
        </small>
      </div>
      <p className="formError" role="alert">
        {error ? t(`errors.${error}`) : ""}
      </p>
      {resent && (
        <p className="status" role="status">
          {t("verify.resent")}
        </p>
      )}
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending || code.length < CODE_LENGTH}>
        {pending ? t("reset.saving") : t("reset.save")}
      </Button>
      <p className="authSwitch">
        <button className="textButton" type="button" onClick={() => request(email)} disabled={pending}>
          {t("verify.resend")}
        </button>
        {" · "}
        <button className="textButton" type="button" onClick={() => setEmail(null)} disabled={pending}>
          {t("verify.changeEmail")}
        </button>
      </p>
    </form>
  );
}
