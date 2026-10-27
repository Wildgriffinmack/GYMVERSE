import type { ReactNode } from "react";
import { cx } from "@/lib/ui";

export function Section({ id, labelledBy, className, children }: { id?: string; labelledBy: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cx("relative py-20 sm:py-24", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

export function SectionHeading({
  id,
  kicker,
  title,
  intro,
  align = "left",
  className,
}: {
  id: string;
  kicker: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cx("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <p className="font-label text-[14px] font-bold uppercase tracking-[0.18em] text-flame">{kicker}</p>
      <h2 id={id} className="mt-3 font-display text-[34px] uppercase leading-[1.02] tracking-[0.01em] text-warm sm:text-[46px]">
        {title}
      </h2>
      {intro ? <p className="mt-4 text-[17px] leading-relaxed text-ash sm:text-lg">{intro}</p> : null}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-3xl border border-white/[0.07] bg-iron p-6", className)}>{children}</div>;
}

export function IconTile({ name, tone = "flame", children }: { name?: string; tone?: "flame" | "gold"; children: ReactNode }) {
  return (
    <span
      data-icon={name}
      className={cx(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border",
        tone === "gold" ? "border-gold/30 bg-gold/10 text-gold" : "border-flame/25 bg-flame/10 text-flame",
      )}
    >
      {children}
    </span>
  );
}
