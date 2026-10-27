import { AnalyticsBoot } from "@/components/AnalyticsBoot";
import { Challenge, Coaches, Perks } from "@/components/Community";
import { Audience, Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { WaitlistSection } from "@/components/waitlist/WaitlistSection";
import { resolveHeroVariant } from "@/lib/variants";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Rendered per request so the A/B headline (?v=1|2|3) is in the HTML with no flash. */
export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const variant = resolveHeroVariant((await searchParams).v);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-warm focus:px-4 focus:py-2 focus:font-label focus:font-bold focus:text-charcoal"
      >
        Skip to content
      </a>
      <AnalyticsBoot heroVariant={variant.id} />
      <Header />
      <main id="main">
        <Hero variant={variant} />
        <Problem />
        <Features />
        <Audience />
        <WaitlistSection />
        <Perks />
        <Challenge />
        <Coaches />
      </main>
      <Footer />
    </>
  );
}
