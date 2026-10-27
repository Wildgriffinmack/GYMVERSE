import { ArrowRight, Check, Sparkles } from "lucide-react";
import { HERO, type HeroVariant } from "@/lib/content";
import { COACH_ANCHOR } from "@/lib/ui";
import { HeroPreview } from "./HeroPreview";
import { CtaLink } from "./ui/CtaLink";

export function Hero({ variant }: { variant: HeroVariant }) {
  return (
    <section id="top" aria-labelledby="hero-title" className="bg-hero relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-10 lg:pb-28 lg:pt-20">
        <div>
          <p className="gv-rise inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 font-label text-[13px] font-bold uppercase tracking-[0.14em] text-warm">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inset-0 animate-ping rounded-full bg-hot opacity-60 motion-reduce:hidden" />
              <span className="relative size-2 rounded-full bg-hot" />
            </span>
            {HERO.eyebrow}
            <span aria-hidden="true" className="text-ash/60">
              |
            </span>
            <span className="sr-only">, </span>
            <span className="text-gold">{HERO.eyebrowGold}</span>
          </p>

          <h1
            id="hero-title"
            data-variant={variant.id}
            className="gv-rise mt-5 font-display text-[44px] uppercase leading-[0.98] tracking-[0.01em] text-warm [animation-delay:80ms] min-[400px]:text-[50px] sm:text-[64px] lg:text-[74px]"
          >
            {variant.lead} <span className="text-gradient">{variant.accent}</span>
          </h1>

          <p className="gv-rise mt-5 max-w-xl text-[17px] leading-relaxed text-ash [animation-delay:160ms] sm:text-[19px]">{HERO.subheadline}</p>

          <div className="gv-rise mt-8 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <CtaLink href="#waitlist" tab="member" location="hero_primary" className="gv-glow sm:px-7">
              {HERO.primaryCta}
              <ArrowRight aria-hidden="true" size={20} strokeWidth={2.6} />
            </CtaLink>
            <CtaLink href={`#${COACH_ANCHOR}`} tab="coach" location="hero_secondary" variant="secondary">
              {HERO.secondaryCta}
            </CtaLink>
          </div>

          <p className="gv-rise mt-5 flex items-center gap-2 text-[15px] text-warm/85 [animation-delay:300ms]">
            <Sparkles aria-hidden="true" size={17} className="shrink-0 text-flame" />
            {HERO.hype}
          </p>

          <ul className="gv-rise mt-6 flex flex-wrap gap-x-5 gap-y-2 [animation-delay:360ms]">
            {HERO.chips.map((chip) => (
              <li key={chip} className="flex items-center gap-1.5 font-label text-[14px] font-bold uppercase tracking-[0.1em] text-ash">
                <Check aria-hidden="true" size={15} strokeWidth={3} className="text-flame" />
                {chip}
              </li>
            ))}
          </ul>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}
