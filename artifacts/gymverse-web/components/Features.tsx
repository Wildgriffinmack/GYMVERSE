import { AUDIENCES, FEATURES } from "@/lib/content";
import { Icon } from "./ui/Icon";
import { IconTile, Section, SectionHeading } from "./ui/Section";

export function Features() {
  return (
    <Section labelledBy="features-title" className="border-y border-white/[0.04] bg-[linear-gradient(180deg,#090909,#0f0a08_50%,#090909)]">
      <SectionHeading id="features-title" kicker={FEATURES.kicker} title={FEATURES.title} />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.items.map((f) => (
          <li key={f.title} className="gv-reveal group rounded-3xl border border-white/[0.07] bg-iron p-6 transition-colors hover:border-flame/30">
            <IconTile name={f.icon}>
              <Icon name={f.icon} />
            </IconTile>
            <h3 className="mt-5 font-display text-[24px] uppercase leading-none text-warm">{f.title}</h3>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ash">{f.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Audience() {
  return (
    <Section labelledBy="audience-title">
      <SectionHeading id="audience-title" kicker={AUDIENCES.kicker} title={AUDIENCES.title} />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AUDIENCES.items.map((a) => (
          <li key={a.title} className="gv-reveal flex items-start gap-4 rounded-3xl border border-white/[0.07] bg-iron p-5 sm:p-6">
            <IconTile name={a.icon}>
              <Icon name={a.icon} />
            </IconTile>
            <div>
              <h3 className="font-display text-[22px] uppercase leading-none text-warm">{a.title}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-ash">{a.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
