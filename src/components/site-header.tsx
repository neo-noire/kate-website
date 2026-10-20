"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
          <div>
            <span className="text-primary">Latin</span>
            <span>Kate</span>
          </div>
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
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard" onClick={close}>
              {t("myDashboard")} <ArrowUpRight aria-hidden />
            </Link>
          </Button>
          <button
            className="menuBtn"
            aria-label={t("openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X size={24} aria-hidden />
            ) : (
              <Menu size={24} aria-hidden />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
