"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { ConfirmDelete, FormDialog } from "./dialogs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { FormState } from "@/lib/catalog/form-state";

type CourseActionsProps = {
  courseId: string;
  courseTitle: string;
  editForm: ReactNode;
  newLessonForm: ReactNode;
  deleteAction: (state: FormState, form: FormData) => Promise<FormState>;
};

type OpenDialog = "edit" | "lesson" | "delete" | null;

/** The ⋯ menu on a course card. Each item opens its dialog, which lives outside the menu so it survives the menu closing. */
export function CourseActions({ courseId, courseTitle, editForm, newLessonForm, deleteAction }: CourseActionsProps) {
  const t = useTranslations("admin");
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={t("courseOptions")}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("edit")}>
            <Pencil aria-hidden /> {t("editCourse")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("lesson")}>
            <Plus aria-hidden /> {t("newLesson")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
            <Trash2 aria-hidden /> {t("deleteCourse")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialog mode="edit" title={courseTitle} open={dialog === "edit"} onOpenChange={close}>
        {editForm}
      </FormDialog>
      <FormDialog mode="add" title={t("newLesson")} open={dialog === "lesson"} onOpenChange={close}>
        {newLessonForm}
      </FormDialog>
      <ConfirmDelete action={deleteAction} id={courseId} title={courseTitle} open={dialog === "delete"} onOpenChange={close} />
    </>
  );
}
