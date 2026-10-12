"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { LanguagePicker } from "./language-picker";

export function SiteHeader() {
  const t = useTranslations("nav");
  // Every link in the header navigates, so following one closes the menu. The header doesn't
  // read the pathname, which keeps it in the static shell of every page.
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const anchors = [
    { id: "courses", label: t("programs") },
    { id: "approach", label: t("approach") },
    { id: "contact", label: t("contact") },
  ];

  return (
    <header>
      <div className="wrap">
        <Link className="brand" href="/" onClick={close}>
          <i />
          RITMO
          <span aria-hidden="true" style={{ fontSize: 12, color: "var(--red)", letterSpacing: 0 }}>
            .
          </span>
        </Link>
        <nav className={menuOpen ? "open" : undefined}>
          {anchors.map((anchor) => (
            <Link key={anchor.id} href={`/#${anchor.id}`} onClick={close}>
              {anchor.label}
            </Link>
          ))}
        </nav>
        <div className="navRight">
          <LanguagePicker />
          {/* Signed-out visitors are sent to sign in, then come back to the dashboard. */}
          <Link className="btn outline" href="/dashboard" onClick={close}>
            {t("myDashboard")} <ArrowUpRight size={16} aria-hidden />
          </Link>
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
    </header>
  );
}
