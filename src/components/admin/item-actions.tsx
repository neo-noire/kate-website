"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { ConfirmDelete, FormDialog } from "./dialogs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { FormState } from "@/lib/catalog/form-state";

type ItemActionsProps = {
  id: string;
  /** Names the item in the dialogs. */
  title: string;
  /** Menu labels, e.g. "Edit course" / "Delete course". */
  editLabel?: string;
  deleteLabel: string;
  editForm?: ReactNode;
  /** An extra "add" entry, e.g. "New lesson" on a course. */
  add?: { label: string; form: ReactNode };
  deleteAction: (state: FormState, form: FormData) => Promise<FormState>;
};

type OpenDialog = "edit" | "add" | "delete" | null;

/** The ⋯ menu on a card. Each item opens its dialog, which lives outside the menu so it survives the menu closing. */
export function ItemActions({ id, title, editLabel, deleteLabel, editForm, add, deleteAction }: ItemActionsProps) {
  const t = useTranslations("admin");
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={t("options")}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {editForm && (
            <DropdownMenuItem onSelect={() => setDialog("edit")}>
              <Pencil aria-hidden /> {editLabel}
            </DropdownMenuItem>
          )}
          {add && (
            <DropdownMenuItem onSelect={() => setDialog("add")}>
              <Plus aria-hidden /> {add.label}
            </DropdownMenuItem>
          )}
          {(editForm || add) && <DropdownMenuSeparator />}
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
            <Trash2 aria-hidden /> {deleteLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {editForm && (
        <FormDialog mode="edit" title={title} open={dialog === "edit"} onOpenChange={close}>
          {editForm}
        </FormDialog>
      )}
      {add && (
        <FormDialog mode="add" title={add.label} open={dialog === "add"} onOpenChange={close}>
          {add.form}
        </FormDialog>
      )}
      <ConfirmDelete action={deleteAction} id={id} title={title} open={dialog === "delete"} onOpenChange={close} />
    </>
  );
}
