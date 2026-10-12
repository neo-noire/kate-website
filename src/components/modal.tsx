"use client";

import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

const FOCUSABLE = "button,a[href],input,select,textarea";

/**
 * Open/closed state for a dialog. Dialogs close when their route is hidden by a client
 * navigation, so a preserved page never comes back with a stale dialog open.
 */
export function useDialogState() {
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => () => setOpen(false), []);
  return { open, show: () => setOpen(true), close: () => setOpen(false) };
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  children: ReactNode;
};

export function Modal({ open, onClose, label, children }: ModalProps) {
  const t = useTranslations("common");
  const dialog = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const returnFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLElement>("input,button:not(.close),select,textarea")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !dialog.current) return;
      const nodes = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (node) => !(node as HTMLButtonElement).disabled,
      );
      const first = nodes[0];
      const last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="modalBackdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-label={label} ref={dialog}>
        <button className="close" aria-label={t("close")} onClick={onClose}>
          <X size={20} aria-hidden />
        </button>
        {children}
      </section>
    </div>,
    document.body,
  );
}
