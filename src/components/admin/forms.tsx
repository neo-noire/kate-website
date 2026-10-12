"use client";

import { useLocale, useTranslations } from "next-intl";
import { createContext, use, useActionState, useEffect, useRef, startTransition, type ReactNode } from "react";
import { initialFormState, type FormState } from "@/lib/catalog/form-state";
import { localeLabels, routing } from "@/i18n/routing";
import type { Localized } from "@/lib/localized";

type Action = (state: FormState, form: FormData) => Promise<FormState>;

const FormStateContext = createContext<FormState>(initialFormState);

type ActionFormProps = {
  action: Action;
  submitLabel: string;
  children?: ReactNode;
  /** Clear the fields after a successful submit (for "new item" forms). */
  resetOnSuccess?: boolean;
  /** Ask before submitting (for deletes). */
  confirm?: string;
  danger?: boolean;
  /** Hidden fields, e.g. the id of the item being edited. */
  hidden?: Record<string, string>;
};

/** A form bound to an admin server action, with its result shown next to the button. */
export function ActionForm({ action, submitLabel, children, resetOnSuccess, confirm, danger, hidden }: ActionFormProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) form.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={form}
      className={children ? "adminForm" : "adminInlineForm"}
      noValidate
      onSubmit={(event) => {
        // Submitting manually keeps typed values when the server rejects them; React would
        // otherwise reset the form after every action.
        event.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <FormStateContext value={state}>{children}</FormStateContext>
      <div className="adminActions">
        <button className={`btn${danger ? " quiet danger" : children ? "" : " outline"}`} disabled={pending}>
          {submitLabel}
        </button>
        <span className={`adminStatus${state.error ? " error" : ""}`} role="status" key={state.at}>
          {state.error && !state.field ? t(`errors.${state.error}`) : state.ok && !resetOnSuccess && children ? t("saved") : ""}
        </span>
      </div>
    </form>
  );
}

function FieldError({ name }: { name: string }) {
  const t = useTranslations("admin.errors");
  const state = use(FormStateContext);
  if (!state.error || state.field !== name) return null;
  return (
    <small className="fieldError" role="alert">
      {t(state.error)}
    </small>
  );
}

type TextFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  hint?: string;
  type?: "text" | "number" | "email" | "url";
  required?: boolean;
  multiline?: boolean;
  inputMode?: "decimal" | "numeric";
};

export function TextField({ name, label, defaultValue, hint, type = "text", required, multiline, inputMode }: TextFieldProps) {
  const value = defaultValue ?? "";
  return (
    <label className="adminField">
      <span>{label}</span>
      {multiline ? (
        <textarea name={name} defaultValue={value} required={required} rows={3} />
      ) : (
        <input name={name} type={type} defaultValue={value} required={required} inputMode={inputMode} />
      )}
      {hint && <small className="fieldHint">{hint}</small>}
      <FieldError name={name} />
    </label>
  );
}

/** One input per site language, submitted as `name.en`, `name.uk`, ... */
export function LocalizedField({
  name,
  label,
  defaultValue,
  hint,
  required,
  multiline,
}: Omit<TextFieldProps, "defaultValue" | "type" | "inputMode"> & { defaultValue?: Localized | null }) {
  return (
    <fieldset className="adminLocalized">
      <legend>{label}</legend>
      {routing.locales.map((locale) => (
        <TextField
          key={locale}
          name={`${name}.${locale}`}
          label={localeLabels[locale]}
          defaultValue={defaultValue?.[locale]}
          required={required && locale === routing.defaultLocale}
          multiline={multiline}
        />
      ))}
      {hint && <small className="fieldHint">{hint}</small>}
    </fieldset>
  );
}

export function CheckboxField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="adminCheckbox">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="adminField">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError name={name} />
    </label>
  );
}
