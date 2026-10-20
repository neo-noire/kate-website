"use client";

import { useLocale, useTranslations } from "next-intl";
import { createContext, use, useActionState, useEffect, useId, useRef, startTransition, type ReactNode } from "react";
import { useCloseDialog } from "./dialogs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
  const closeDialog = useCloseDialog();

  useEffect(() => {
    if (!state.ok) return;
    if (resetOnSuccess) form.current?.reset();
    closeDialog?.();
  }, [state, resetOnSuccess, closeDialog]);

  return (
    <form
      ref={form}
      className={children ? "grid gap-4" : "inline-flex"}
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
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button variant={danger ? "destructive" : children ? "default" : "outline"} disabled={pending}>
          {submitLabel}
        </Button>
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
  const id = useId();
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {multiline ? (
        <Textarea id={id} name={name} defaultValue={value} required={required} rows={3} className="min-h-0" />
      ) : (
        <Input id={id} name={name} type={type} defaultValue={value} required={required} inputMode={inputMode} />
      )}
      {hint && <small className="text-xs text-muted-foreground">{hint}</small>}
      <FieldError name={name} />
    </div>
  );
}

/** One input per site language, side by side, submitted as `name.en`, `name.uk`, ... */
export function LocalizedField({
  name,
  label,
  defaultValue,
  hint,
  required,
  multiline,
}: Omit<TextFieldProps, "defaultValue" | "type" | "inputMode"> & { defaultValue?: Localized | null }) {
  return (
    <fieldset className="m-0 grid gap-2 border-0 p-0">
      <legend className="mb-1 text-sm">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>
      {hint && <small className="text-xs text-muted-foreground">{hint}</small>}
    </fieldset>
  );
}

export function CheckboxField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2 self-center">
      <Checkbox id={id} name={name} defaultChecked={defaultChecked} />
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
    </div>
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
  const id = useId();
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        data-slot="select"
        className={cn(
          "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-background">
            {option.label}
          </option>
        ))}
      </select>
      <FieldError name={name} />
    </div>
  );
}
