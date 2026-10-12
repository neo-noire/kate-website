"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((next: string) => {
    setMessage(next);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setMessage(null), 3500);
  }, []);

  useEffect(() => () => clearTimeout(timeout.current), []);

  return (
    <ToastContext value={show}>
      {children}
      <div className={`toast${message ? "" : " hidden"}`} role="status">
        {message}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
