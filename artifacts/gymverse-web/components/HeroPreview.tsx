import { Flame, Medal, MessageCircle, Trophy } from "lucide-react";
import { Logo } from "./ui/Logo";

/** Illustrative feed preview. Names and posts are fictional examples. */
export function HeroPreview() {
  return (
    <figure
      role="img"
      aria-label="Illustrative preview of the GYMX feed: supportive comments on a beginner’s first week back, and a first pull-up PR."
      className="gv-rise relative mx-auto w-full max-w-[360px] [animation-delay:200ms] lg:max-w-[380px]"
    >
      <div aria-hidden="true" className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle,rgba(255,90,31,0.28),transparent_65%)] blur-2xl" />

      <div className="rounded-[2.4rem] border border-white/10 bg-charcoal/85 p-3 shadow-[0_40px_120px_-40px_rgba(255,90,31,0.6)] backdrop-blur">
        <div className="rounded-[1.9rem] border border-white/[0.06] bg-iron/70 p-3.5">
          <div className="flex items-center justify-between px-1 pb-3">
            <Logo className="text-[18px]" />
            <span className="rounded-full bg-white/5 px-2.5 py-1 font-label text-[11px] font-bold uppercase tracking-[0.14em] text-ash">For your goals</span>
          </div>

          <article className="rounded-2xl border border-white/[0.06] bg-charcoal/70 p-4">
            <header className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-cta font-display text-[15px] text-white">MK</span>
              <div className="min-w-0">
                <p className="font-label text-[16px] font-bold leading-tight text-warm">maya.moves</p>
                <p className="text-[12.5px] text-ash">Beginner · Week 1</p>
              </div>
            </header>
            <p className="mt-3 text-[14.5px] leading-snug text-warm/90">First week back after a long break. Three workouts, zero perfect ones. Still showed up.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["#smallwins", "#reset"].map((t) => (
                <span key={t} className="rounded-full bg-flame/10 px-2.5 py-0.5 font-label text-[12.5px] font-bold text-flame">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 border-t border-white/[0.06] pt-3 text-[13px] text-ash">
              <span className="flex items-center gap-1.5">
                <Flame size={15} className="text-flame" /> 128
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle size={15} /> 24
              </span>
            </div>
            <div className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13.5px] leading-snug">
              <span className="font-label font-bold text-warm">coach.dre </span>
              <span className="text-warm/80">Proud of this. Showing up is the hard part.</span>
            </div>
          </article>

          <article className="mt-3 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-charcoal/70 p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-hot/15 text-hot">
              <Trophy size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2">
                <span className="rounded-md bg-hot px-1.5 py-0.5 font-label text-[11px] font-extrabold uppercase tracking-[0.1em] text-white">PR</span>
                <span className="font-label text-[12.5px] font-bold text-ash">jay.trains</span>
              </p>
              <p className="mt-1 font-label text-[16px] font-bold leading-tight text-warm">First unassisted pull-up</p>
            </div>
          </article>
        </div>
      </div>

      <div aria-hidden="true" className="gv-float absolute -right-2 -top-5 flex items-center gap-2 rounded-2xl border border-gold/40 bg-charcoal/95 px-3 py-2 shadow-lg sm:-right-6">
        <Medal size={18} className="text-gold" />
        <span className="font-label text-[13px] font-extrabold uppercase tracking-[0.12em] text-gold">First 500</span>
      </div>
      <div aria-hidden="true" className="gv-float absolute -bottom-5 -left-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-charcoal/95 px-3 py-2 shadow-lg [animation-delay:1.2s] sm:-left-6">
        <Flame size={18} className="text-flame" />
        <span className="font-label text-[13px] font-extrabold uppercase tracking-[0.12em] text-warm">
          Day 3 <span className="text-gold">streak</span>
        </span>
      </div>
    </figure>
  );
}
