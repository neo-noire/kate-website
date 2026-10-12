"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
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
  const { user } = useDemoState();
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so it closes on any navigation.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const setMenuOpen = (open: boolean) => setMenuPath(open ? pathname : null);
  const login = useDialogState();

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
            {t("myDashboard")} <ArrowUpRight size={16} aria-hidden />
          </button>
          <button
            className="menuBtn"
            aria-label={t("openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
          </button>
        </div>
      </div>
      <LoginDialog open={login.open} onClose={login.close} onSignedIn={() => router.push("/dashboard")} />
    </header>
  );
}
