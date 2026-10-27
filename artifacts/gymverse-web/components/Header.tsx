"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV } from "@/lib/content";
import { CtaLink } from "./ui/CtaLink";
import { Logo } from "./ui/Logo";

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-iron/90 backdrop-blur-md supports-[backdrop-filter]:bg-iron/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <a href="#top" aria-label="GYMX, back to top" className="flex shrink-0 flex-col items-start gap-1 rounded-lg sm:flex-row sm:items-center sm:gap-2.5">
          <Logo className="text-[22px] sm:text-[26px]" />
          <span className="rounded-full border border-flame/40 bg-flame/10 px-2 py-0.5 font-label text-[10.5px] font-bold uppercase leading-none tracking-[0.16em] text-flame sm:text-[11.5px]">
            {NAV.badge}
          </span>
        </a>

        <nav aria-label="Primary" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="font-label text-[15px] font-bold uppercase tracking-[0.12em] text-ash transition-colors hover:text-warm">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <CtaLink href="#waitlist" tab="member" location="header" size="md" className="ml-auto md:ml-4">
          {NAV.cta}
        </CtaLink>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-warm transition hover:bg-white/5 md:hidden"
        >
          {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
        </button>
      </div>

      <nav id="mobile-nav" aria-label="Mobile" hidden={!open} className="border-t border-white/[0.06] md:hidden">
        <ul className="mx-auto max-w-6xl px-4 py-2">
          {NAV.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-2 py-3.5 font-label text-[18px] font-bold uppercase tracking-[0.1em] text-warm transition-colors hover:bg-white/5"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
