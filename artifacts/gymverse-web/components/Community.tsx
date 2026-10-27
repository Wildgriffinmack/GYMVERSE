import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { CHALLENGE, COACHES, PERKS } from "@/lib/content";
import { COACH_ANCHOR, cx } from "@/lib/ui";
import { CtaLink } from "./ui/CtaLink";
import { Icon } from "./ui/Icon";
import { IconTile, Section, SectionHeading } from "./ui/Section";

export function Perks() {
  return (
    <Section labelledBy="perks-title" className="border-y border-white/[0.04] bg-[linear-gradient(180deg,#090909,#100d07_50%,#090909)]">
      <SectionHeading id="perks-title" kicker={PERKS.kicker} title={PERKS.title} />
      <ul className="mt-10 grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 lg:grid-cols-4">
        {PERKS.items.map((perk) => {
          const highlight = "highlight" in perk && perk.highlight;
          return (
            <li
              key={perk.title}
              className={cx(
                "gv-reveal relative flex items-start gap-4 rounded-3xl border p-5 min-[460px]:block",
                highlight ? "border-gold/50 bg-[linear-gradient(160deg,rgba(255,209,102,0.14),#1A1A1A_55%)] shadow-[0_24px_60px_-36px_rgba(255,209,102,0.6)]" : "border-white/[0.07] bg-iron",
              )}
            >
              {highlight ? (
                <span className="absolute right-4 top-4 rounded-full bg-gold px-2 py-0.5 font-label text-[11px] font-extrabold uppercase tracking-[0.12em] text-charcoal">Limited</span>
              ) : null}
              <IconTile name={perk.icon} tone="gold">
                <Icon name={perk.icon} />
              </IconTile>
              <div>
                <h3 className={cx("font-label text-[19px] font-extrabold uppercase leading-tight tracking-[0.04em] min-[460px]:mt-4", highlight ? "pr-16 text-gold min-[460px]:pr-0" : "text-warm")}>{perk.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ash">{perk.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function Challenge() {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);
  return (
    <Section labelledBy="challenge-title">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <SectionHeading id="challenge-title" kicker={CHALLENGE.kicker} title={CHALLENGE.title} intro={CHALLENGE.body} />
          <ul className="mt-6 flex flex-wrap gap-2">
            {CHALLENGE.rules.map((rule) => (
              <li key={rule} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-label text-[14px] font-bold uppercase tracking-[0.08em] text-warm">
                <Check aria-hidden="true" size={14} strokeWidth={3} className="text-flame" />
                {rule}
              </li>
            ))}
          </ul>
          <CtaLink href="#waitlist" tab="member" location="challenge" className="mt-8 w-full sm:w-auto">
            {CHALLENGE.cta}
          </CtaLink>
        </div>

        <div className="gv-reveal rounded-[2rem] border border-white/[0.08] bg-iron p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="font-label text-[14px] font-bold uppercase tracking-[0.16em] text-ash">{CHALLENGE.exampleLabel}</p>
            <p className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-label text-[13px] font-extrabold uppercase tracking-[0.1em] text-gold">
              <Icon name="flame" size={15} />
              {CHALLENGE.exampleDoneDays}-day streak
            </p>
          </div>
          <ol className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2" aria-label={`Example week: ${CHALLENGE.exampleDoneDays} of 7 days done`}>
            {days.map((day) => {
              const doneDay = day <= CHALLENGE.exampleDoneDays;
              return (
                <li key={day} className="flex flex-col items-center gap-1.5">
                  <span
                    className={cx(
                      "flex aspect-square w-full max-w-12 items-center justify-center rounded-xl border font-display text-[15px] sm:text-[17px]",
                      doneDay ? "border-transparent bg-cta text-white" : "border-white/10 bg-charcoal text-ash",
                    )}
                  >
                    {doneDay ? <Check aria-hidden="true" size={18} strokeWidth={3} /> : day}
                  </span>
                  <span className="font-label text-[11.5px] font-bold uppercase tracking-[0.08em] text-ash">D{day}</span>
                </li>
              );
            })}
          </ol>

          <p className="mt-7 font-label text-[14px] font-bold uppercase tracking-[0.16em] text-ash">{CHALLENGE.actionsTitle}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CHALLENGE.actions.map((action) => (
              <li key={action.label} className="flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-charcoal px-3 py-3 text-[15px] font-medium text-warm">
                <Icon name={action.icon} size={18} className="shrink-0 text-flame" />
                {action.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export function Coaches() {
  return (
    <Section id="coaches" labelledBy="coaches-title" className="pb-24 sm:pb-28">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-iron bg-[radial-gradient(circle_at_85%_15%,rgba(255,90,31,0.22),transparent_45%),radial-gradient(circle_at_10%_100%,rgba(255,46,46,0.14),transparent_40%)] p-6 sm:p-10 lg:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <SectionHeading id="coaches-title" kicker={COACHES.kicker} title={COACHES.title} intro={COACHES.body} />
            <CtaLink href={`#${COACH_ANCHOR}`} tab="coach" location="coaches" className="mt-8 w-full sm:w-auto">
              {COACHES.cta}
              <ArrowRight aria-hidden="true" size={20} strokeWidth={2.6} />
            </CtaLink>
          </div>
          <div className="rounded-3xl border border-white/[0.08] bg-charcoal/80 p-6">
            <h3 className="font-label text-[15px] font-bold uppercase tracking-[0.16em] text-ash">{COACHES.listTitle}</h3>
            <ul className="mt-4 space-y-3">
              {COACHES.list.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[16.5px] font-medium text-warm">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-flame/15 text-flame">
                    <Check aria-hidden="true" size={15} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-start gap-2.5 border-t border-white/[0.06] pt-5 text-[13.5px] leading-snug text-ash">
              <ShieldCheck aria-hidden="true" size={17} className="mt-px shrink-0 text-flame" />
              {COACHES.note}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
