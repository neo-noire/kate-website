"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useDemoState } from "@/lib/demo-store";
import { LanguagePicker } from "./language-picker";
import { LoginDialog } from "./login-dialog";
import { useDialogState } from "./modal";

export function SiteHeader() {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useDemoState();
  const [menuOpen, setMenuOpen] = useState(false);
  const login = useDialogState();
  const onDashboard = pathname === "/dashboard";

  const anchors = [
    { id: "courses", label: t("programs") },
    { id: "approach", label: t("approach") },
    { id: "contact", label: t("contact") },
  ];

  return (
    <header>
      <div className="wrap">
        <Link className="brand" href="/">
          <i />
          RITMO
          <span aria-hidden="true" style={{ fontSize: 12, color: "var(--red)", letterSpacing: 0 }}>
            .
          </span>
        </Link>
        <nav className={menuOpen ? "open" : undefined}>
          {anchors.map((anchor) => (
            <Link key={anchor.id} href={`/#${anchor.id}`} onClick={() => setMenuOpen(false)}>
              {anchor.label}
            </Link>
          ))}
        </nav>
        <div className="navRight">
          <LanguagePicker />
          <button className="btn outline" onClick={() => (user ? router.push("/dashboard") : login.show())}>
            {user || !onDashboard ? t("myDashboard") : t("demoDashboard")}
          </button>
          <button
            className="menuBtn"
            aria-label={t("openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
        </div>
      </div>
      <LoginDialog open={login.open} onClose={login.close} onSignedIn={() => router.push("/dashboard")} />
    </header>
  );
}
