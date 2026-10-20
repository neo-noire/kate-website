"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createContext, startTransition, use, useActionState, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { initialFormState, type FormState } from "@/lib/catalog/form-state";

/** Lets an ActionForm inside a FormDialog close the dialog once its action succeeds. */
export const CloseDialogContext = createContext<(() => void) | null>(null);

type FormDialogProps = {
  title: string;
  /** "add" shows a plus button with the title as its label; "edit" shows a compact pencil button. */
  mode: "add" | "edit";
  children: ReactNode;
};

/** A button that opens a dialog around a form. Radix unmounts the form on close, so it starts fresh next time. */
export function FormDialog({ title, mode, children }: FormDialogProps) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "add" ? (
          <Button variant="outline" size="sm">
            <Plus aria-hidden /> {title}
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            <Pencil aria-hidden /> {t("edit")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none bg-[var(--panel)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        <CloseDialogContext value={() => setOpen(false)}>{children}</CloseDialogContext>
      </DialogContent>
    </Dialog>
  );
}

type ConfirmDeleteProps = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  id: string;
  /** Text of the button that opens the confirmation. Omit for an icon-only button. */
  label?: string;
  /** Dialog heading, e.g. the name of the thing being deleted. */
  title: string;
};

/** A delete button that asks in a dialog first. Replaces the browser's window.confirm. */
export function ConfirmDelete({ action, id, label, title }: ConfirmDeleteProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action, initialFormState);

  function remove() {
    const data = new FormData();
    data.set("id", id);
    data.set("locale", locale);
    startTransition(() => formAction(data));
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size={label ? "sm" : "icon-sm"} className="text-destructive" aria-label={label ?? t("delete")}>
          <Trash2 aria-hidden /> {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-none bg-[var(--panel)]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirmDelete")}</AlertDialogDescription>
        </AlertDialogHeader>
        {state.error && (
          <p className="fieldError" role="alert">
            {t(`errors.${state.error}`)}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={remove}
          >
            {t("delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useCloseDialog() {
  return use(CloseDialogContext);
}
