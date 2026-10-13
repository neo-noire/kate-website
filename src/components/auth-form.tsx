"use client";

import { ArrowUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { getPathname, Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { safeNextPath } from "@/lib/auth/next-path";
import { useLocalizedValidation } from "@/lib/validation";

type Mode = "signIn" | "signUp";
type ErrorKey = "invalidCredentials" | "emailTaken" | "passwordTooShort" | "tooManyRequests" | "oauth" | "generic";

const MIN_PASSWORD_LENGTH = 8;

const noopSubscribe = () => () => {};

/**
 * The query string, read in the browser so the form itself stays in the static page
 * (useSearchParams would push it behind a Suspense boundary). Empty during prerendering.
 */
function useQuery() {
  return new URLSearchParams(useSyncExternalStore(noopSubscribe, () => window.location.search, () => ""));
}

/** Maps Better Auth error codes to our own messages. */
function errorKey(error: { code?: string; status?: number }): ErrorKey {
  if (error.status === 429) return "tooManyRequests";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "invalidCredentials";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "emailTaken";
    case "PASSWORD_TOO_SHORT":
      return "passwordTooShort";
    default:
      return "generic";
  }
}

export function AuthForm({ mode, google }: { mode: Mode; google: boolean }) {
  const t = useTranslations("auth");
  const validation = useLocalizedValidation();
  const locale = useLocale();
  const query = useQuery();
  const nextPath = safeNextPath(query.get("next"));
  const [pending, setPending] = useState(false);
  const [submitError, setError] = useState<ErrorKey | null>(null);
  // Google sends people back here with ?error=… when sign-in fails or is cancelled.
  const error = submitError ?? (query.has("error") ? "oauth" : null);

  async function continueWithGoogle() {
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: nextPath,
      errorCallbackURL: mode === "signUp" ? "/sign-up" : "/sign-in",
    });
    // On success the browser is already leaving for Google.
    if (error) {
      setError(errorKey(error) === "tooManyRequests" ? "tooManyRequests" : "oauth");
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));
    setPending(true);
    setError(null);
    const { error } =
      mode === "signUp"
        ? await authClient.signUp.email({ name: String(data.get("name")).trim(), email, password })
        : await authClient.signIn.email({ email, password });
    if (error) {
      setError(errorKey(error));
      setPending(false);
      return;
    }
    // A full page load, not a client navigation: the router may hold a copy of the
    // dashboard prefetched while signed out (a redirect back here).
    window.location.assign(getPathname({ href: nextPath, locale }));
  }

  const otherMode = mode === "signIn" ? "signUp" : "signIn";
  const otherHref = {
    pathname: otherMode === "signIn" ? "/sign-in" : "/sign-up",
    query: nextPath === "/dashboard" ? {} : { next: nextPath },
  } as const;

  return (
    <>
      {google && (
        <>
          <button className="btn outline googleButton" type="button" onClick={continueWithGoogle} disabled={pending}>
            <GoogleMark /> {t("google")}
          </button>
          <p className="authDivider">
            <span>{t("or")}</span>
          </p>
        </>
      )}
      <form className="formStack" onSubmit={submit} {...validation}>
        {mode === "signUp" && (
          <label>
            {t("name")}
            <input name="name" autoComplete="name" maxLength={60} placeholder={t("namePlaceholder")} required />
          </label>
        )}
        <label>
          {t("email")}
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          {t("password")}
          <input
            name="password"
            type="password"
            autoComplete={mode === "signUp" ? "new-password" : "current-password"}
            minLength={mode === "signUp" ? MIN_PASSWORD_LENGTH : undefined}
            maxLength={128}
            required
            aria-describedby={mode === "signUp" ? "password-hint" : undefined}
          />
          {mode === "signUp" && (
            <small id="password-hint" className="fieldHint">
              {t("passwordHint")}
            </small>
          )}
        </label>
        <p className="formError" role="alert">
          {error ? t(`errors.${error}`) : ""}
        </p>
        {mode === "signUp" && (
          <p className="authAgreement">
            {t.rich("agreement", {
              terms: (chunks) => <Link href="/terms">{chunks}</Link>,
              privacy: (chunks) => <Link href="/privacy">{chunks}</Link>,
            })}
          </p>
        )}
        <button className="btn" type="submit" disabled={pending}>
          {pending ? t(mode === "signUp" ? "signingUp" : "signingIn") : t(mode)}
          {!pending && <ArrowUpRight size={16} aria-hidden />}
        </button>
      </form>
      <p className="authSwitch">
        {t(mode === "signIn" ? "noAccount" : "haveAccount")}{" "}
        <Link href={otherHref}>{t(otherMode === "signUp" ? "signUp" : "signIn")}</Link>
      </p>
    </>
  );
}

/** Google's "G" mark (brand asset; Lucide has no brand icons). */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
