"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type I18nContextValue = { locale: Locale; dict: Dictionary };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, dict, children }: I18nContextValue & { children: ReactNode }) {
  return <I18nContext value={{ locale, dict }}>{children}</I18nContext>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
