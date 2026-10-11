import type { FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * Browser validation bubbles in the browser's own language. These handlers replace the
 * messages with the site's language; attach them to a form as onInvalidCapture/onInputCapture.
 */
export function localizedValidation(dict: Dictionary) {
  return {
    onInvalidCapture(event: FormEvent<HTMLFormElement>) {
      const field = event.target as Field;
      field.setCustomValidity("");
      const { validity } = field;
      if (validity.valueMissing) field.setCustomValidity(dict.validation.required);
      else if (validity.typeMismatch) field.setCustomValidity(dict.validation.email);
      else if (validity.rangeUnderflow) field.setCustomValidity(dict.validation.futureDate);
    },
    onInputCapture(event: FormEvent<HTMLFormElement>) {
      (event.target as Field).setCustomValidity?.("");
    },
  };
}
