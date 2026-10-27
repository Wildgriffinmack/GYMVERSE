"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, CircleCheck, Info, Megaphone, RotateCcw, UsersRound } from "lucide-react";
import { track } from "@/lib/analytics";
import { WAITLIST } from "@/lib/content";
import { COACH_ANCHOR, TAB_EVENT, cx, type WaitlistTab } from "@/lib/ui";
import { CoachForm } from "./CoachForm";
import { MemberForm } from "./MemberForm";

const TABS: { id: WaitlistTab; label: string; Icon: typeof UsersRound }[] = [
  { id: "member", label: WAITLIST.tabs.member, Icon: UsersRound },
  { id: "coach", label: WAITLIST.tabs.coach, Icon: Megaphone },
];

type Done = Record<WaitlistTab, { persisted: boolean } | null>;

export function WaitlistSection() {
  const [tab, setTab] = useState<WaitlistTab>("member");
  const [done, setDone] = useState<Done>({ member: null, coach: null });
  const [round, setRound] = useState<Record<WaitlistTab, number>>({ member: 0, coach: 0 });
  const tabRefs = useRef<Record<WaitlistTab, HTMLButtonElement | null>>({ member: null, coach: null });

  useEffect(() => {
    const onSelect = (e: Event) => {
      const next = (e as CustomEvent<WaitlistTab>).detail;
      if (next === "member" || next === "coach") setTab(next);
    };
    const onHash = () => {
      if (window.location.hash === `#${COACH_ANCHOR}`) setTab("coach");
    };
    window.addEventListener(TAB_EVENT, onSelect);
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => {
      window.removeEventListener(TAB_EVENT, onSelect);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  function choose(next: WaitlistTab, focus = false) {
    if (next !== tab) track("waitlist_tab_select", { tab: next });
    setTab(next);
    if (focus) tabRefs.current[next]?.focus();
  }

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    const i = TABS.findIndex((t) => t.id === tab);
    const keys: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const target = TABS[(keys[e.key] + TABS.length) % TABS.length];
    choose(target.id, true);
  }

  return (
    <section id="waitlist" aria-labelledby="waitlist-title" className="relative overflow-hidden py-20 sm:py-24">
      <div aria-hidden="true" className="bg-hero pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-label text-[14px] font-bold uppercase tracking-[0.18em] text-flame">{WAITLIST.kicker}</p>
          <h2 id="waitlist-title" className="mt-3 font-display text-[38px] uppercase leading-[1] text-warm sm:text-[52px]">
            {WAITLIST.title}
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-ash sm:text-lg">{WAITLIST.intro}</p>
          <ul className="mt-6 space-y-3">
            {WAITLIST.highlights.map((h) => (
              <li key={h} className="flex items-center gap-3 text-[16px] font-medium text-warm">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <Check aria-hidden="true" size={15} strokeWidth={3} />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div id={COACH_ANCHOR} className="rounded-[2rem] border border-white/[0.08] bg-iron/95 p-4 shadow-[0_40px_120px_-50px_rgba(255,90,31,0.55)] sm:p-7">
          <div role="tablist" aria-label={WAITLIST.tabListLabel} className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.08] bg-charcoal p-1.5">
            {TABS.map(({ id, label, Icon }) => {
              const selected = tab === id;
              return (
                <button
                  key={id}
                  ref={(el) => {
                    tabRefs.current[id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => choose(id)}
                  onKeyDown={onTabKey}
                  className={cx(
                    "flex min-h-13 items-center justify-center gap-2 rounded-xl border px-2.5 py-2 text-center font-label text-[15px] font-bold uppercase leading-tight tracking-[0.06em] transition sm:text-[16px]",
                    selected ? "border-flame/70 bg-flame/15 text-warm shadow-[inset_0_-2px_0_#FF5A1F]" : "border-transparent text-ash hover:text-warm",
                  )}
                >
                  <Icon aria-hidden="true" size={18} className={cx("hidden shrink-0 sm:block", selected && "text-flame")} />
                  {label}
                </button>
              );
            })}
          </div>

          {TABS.map(({ id }) => (
            <div key={id} role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={tab !== id} className="pt-6 sm:pt-7">
              {done[id] ? (
                <Success
                  persisted={done[id].persisted}
                  onAgain={() => {
                    setDone((d) => ({ ...d, [id]: null }));
                    setRound((r) => ({ ...r, [id]: r[id] + 1 }));
                  }}
                />
              ) : id === "member" ? (
                <MemberForm key={round.member} onSuccess={(persisted) => setDone((d) => ({ ...d, member: { persisted } }))} />
              ) : (
                <CoachForm key={round.coach} onSuccess={(persisted) => setDone((d) => ({ ...d, coach: { persisted } }))} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Success({ persisted, onAgain }: { persisted: boolean; onAgain: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="py-6 text-center sm:py-10" aria-live="polite">
      <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-cta text-white shadow-[0_16px_40px_-14px_rgba(255,90,31,0.8)]">
        <CircleCheck aria-hidden="true" size={32} strokeWidth={2.4} />
      </span>
      <h3 ref={headingRef} tabIndex={-1} className="mt-6 font-display text-[34px] uppercase leading-none text-warm focus:outline-none sm:text-[40px]">
        {WAITLIST.success.title}
      </h3>
      <p className="mx-auto mt-4 max-w-md text-[17px] leading-relaxed text-ash">{WAITLIST.success.body}</p>

      {!persisted ? (
        <p className="mx-auto mt-6 flex max-w-md items-start gap-2.5 rounded-2xl border border-white/10 bg-charcoal/70 p-4 text-left text-[13.5px] leading-snug text-ash">
          <Info aria-hidden="true" size={17} className="mt-px shrink-0 text-flame" />
          {WAITLIST.success.previewNote}
        </p>
      ) : null}

      <button type="button" onClick={onAgain} className="mt-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 font-label text-[15px] font-bold uppercase tracking-[0.1em] text-ash transition hover:text-warm">
        <RotateCcw aria-hidden="true" size={16} />
        {WAITLIST.success.again}
      </button>
    </div>
  );
}
