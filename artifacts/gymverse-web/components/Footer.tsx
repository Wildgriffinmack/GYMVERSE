import { FOOTER } from "@/lib/content";
import { LEGAL_LINKS, SOCIAL_LINKS, type SiteLink } from "@/lib/site";
import { cx } from "@/lib/ui";
import { Icon } from "./ui/Icon";
import { Logo } from "./ui/Logo";

function FooterLink({ link, pill }: { link: SiteLink; pill?: boolean }) {
  const className = cx(
    pill
      ? "inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3.5 font-label text-[15px] font-bold uppercase tracking-[0.08em]"
      : "text-[14px]",
    "transition-colors",
  );
  const content = (
    <>
      {link.icon ? <Icon name={link.icon} size={17} /> : null}
      {link.label}
    </>
  );
  if (link.href) {
    return (
      <a href={link.href} className={cx(className, "text-warm hover:text-flame")} {...(pill ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {content}
      </a>
    );
  }
  // Placeholder until the real URL exists; not a dead link.
  return (
    <span className={cx(className, "cursor-default text-ash/80")} title={FOOTER.soon}>
      {content}
      <span className="sr-only"> ({FOOTER.soon.toLowerCase()})</span>
    </span>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.06] bg-iron">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo className="text-[30px]" />
            <p className="mt-3 text-[16px] text-ash">{FOOTER.mission}</p>
          </div>
          <nav aria-label={FOOTER.socialLabel}>
            <ul className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} pill />
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col-reverse gap-4 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ash">© {year} GYMX. All rights reserved.</p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
