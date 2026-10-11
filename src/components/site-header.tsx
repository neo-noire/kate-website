"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useDemoState } from "@/lib/demo-store";
import { useI18n } from "./i18n-provider";
import { LanguagePicker } from "./language-picker";
import { LoginDialog } from "./login-dialog";
import { useDialogState } from "./modal";

export function SiteHeader() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useDemoState();
  const [menuOpen, setMenuOpen] = useState(false);
  const login = useDialogState();
  const dashboardPath = `/${locale}/dashboard`;
  const onDashboard = pathname === dashboardPath;

  const anchors = [
    { id: "courses", label: dict.nav.programs },
    { id: "approach", label: dict.nav.approach },
    { id: "contact", label: dict.nav.contact },
  ];

  return (
    <header>
      <div className="wrap">
        <Link className="brand" href={`/${locale}`}>
          <i />
          RITMO
          <span aria-hidden="true" style={{ fontSize: 12, color: "var(--red)", letterSpacing: 0 }}>
            .
          </span>
        </Link>
        <nav className={menuOpen ? "open" : undefined}>
          {anchors.map((anchor) => (
            <Link key={anchor.id} href={`/${locale}#${anchor.id}`} onClick={() => setMenuOpen(false)}>
              {anchor.label}
            </Link>
          ))}
        </nav>
        <div className="navRight">
          <LanguagePicker />
          <button
            className="btn outline"
            onClick={() => (user ? router.push(dashboardPath) : login.show())}
          >
            {user || !onDashboard ? dict.nav.myDashboard : dict.nav.demoDashboard}
          </button>
          <button
            className="menuBtn"
            aria-label={dict.nav.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
        </div>
      </div>
      <LoginDialog open={login.open} onClose={login.close} onSignedIn={() => router.push(dashboardPath)} />
    </header>
  );
}
