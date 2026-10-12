"use client";

import { useTranslations } from "next-intl";
import type { FormEvent } from "react";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * Browser validation bubbles in the browser's own language. These handlers replace the
 * messages with the site's language; spread the result onto a <form>.
 */
export function useLocalizedValidation() {
  const t = useTranslations("validation");
  return {
    onInvalidCapture(event: FormEvent<HTMLFormElement>) {
      const field = event.target as Field;
      field.setCustomValidity("");
      const { validity } = field;
      if (validity.valueMissing) field.setCustomValidity(t("required"));
      else if (validity.typeMismatch) field.setCustomValidity(t("email"));
      else if (validity.tooShort && "minLength" in field) field.setCustomValidity(t("tooShort", { min: field.minLength }));
    },
    onInputCapture(event: FormEvent<HTMLFormElement>) {
      (event.target as Field).setCustomValidity?.("");
    },
  };
}
