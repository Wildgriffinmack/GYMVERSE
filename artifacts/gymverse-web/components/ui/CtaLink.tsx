"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";
import { cx, selectWaitlistTab, type WaitlistTab } from "@/lib/ui";

type Variant = "primary" | "secondary";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-label font-extrabold uppercase tracking-[0.06em] text-center transition duration-200 active:scale-[0.98] select-none";

const VARIANTS: Record<Variant, string> = {
  // Pure white on the CTA gradient at >= 19px bold keeps WCAG AA large-text contrast across the whole gradient.
  primary: "bg-cta text-white shadow-[0_12px_32px_-12px_rgba(255,90,31,0.75)] hover:brightness-110 [text-shadow:0_1px_1px_rgba(0,0,0,0.18)]",
  secondary: "border border-flame/60 bg-white/[0.03] text-warm hover:border-flame hover:bg-flame/10",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-4 text-[19px] leading-none",
  lg: "min-h-14 px-6 py-3 text-[19px] leading-tight sm:text-[20px]",
};

export function ctaClasses(variant: Variant = "primary", size: Size = "lg", className?: string): string {
  return cx(BASE, VARIANTS[variant], SIZES[size], className);
}

interface CtaLinkProps {
  href: string;
  /** Section or component the CTA sits in; reported as `location` on cta_click. */
  location: string;
  tab?: WaitlistTab;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

/** In-page CTA: smooth-scrolls via the anchor and, when `tab` is set, switches the waitlist tab. */
export function CtaLink({ href, location, tab, variant = "primary", size = "lg", className, children }: CtaLinkProps) {
  return (
    <a
      href={href}
      onClick={() => {
        if (tab) selectWaitlistTab(tab);
        track("cta_click", { location, target: tab ?? href });
      }}
      className={ctaClasses(variant, size, className)}
    >
      {children}
    </a>
  );
}
