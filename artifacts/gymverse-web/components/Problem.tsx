import { Check, X } from "lucide-react";
import { PROBLEM } from "@/lib/content";
import { cx } from "@/lib/ui";
import { Icon } from "./ui/Icon";
import { Section, SectionHeading } from "./ui/Section";

export function Problem() {
  const { traditional, gymx } = PROBLEM.comparison;
  return (
    <Section id="why" labelledBy="why-title">
      <SectionHeading id="why-title" kicker={PROBLEM.kicker} title={PROBLEM.title} />

      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {PROBLEM.points.map((p, i) => (
          <li
            key={p.title}
            className={cx(
              "gv-reveal flex gap-4 rounded-3xl border border-white/[0.07] bg-iron p-5",
              i < 3 ? "lg:col-span-2" : "lg:col-span-3",
              i === PROBLEM.points.length - 1 && "sm:col-span-2 lg:col-span-3",
            )}
          >
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] text-ash">
              <Icon name={p.icon} size={20} />
            </span>
            <div>
              <h3 className="font-label text-[19px] font-bold leading-tight text-warm">{p.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ash">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="gv-reveal rounded-3xl border border-white/[0.07] bg-iron p-6 sm:p-8">
          <h3 className="font-display text-[26px] uppercase leading-none text-ash">{traditional.title}</h3>
          <ul className="mt-6 space-y-3.5">
            {traditional.items.map((item) => (
              <li key={item} className="flex items-center gap-3 text-[16.5px] text-ash">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
                  <X aria-hidden="true" size={15} strokeWidth={2.6} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="gv-reveal relative rounded-3xl bg-cta p-px shadow-[0_30px_80px_-40px_rgba(255,90,31,0.7)]">
          <div className="h-full rounded-[calc(1.5rem-1px)] bg-[linear-gradient(180deg,#1A1A1A,#140b08)] p-6 sm:p-8">
            <h3 className="font-display text-[26px] uppercase leading-none">
              <span className="text-gradient">{gymx.title}</span>
            </h3>
            <ul className="mt-6 space-y-3.5">
              {gymx.items.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[16.5px] font-medium text-warm">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-flame/15 text-flame">
                    <Check aria-hidden="true" size={15} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
