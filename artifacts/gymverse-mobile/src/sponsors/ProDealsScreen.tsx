import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Eye, EyeOff, Info, RotateCcw, ShieldCheck, Tag } from "lucide-react-native";
import { Glows } from "../components/Tone";
import { IconBtn, PageHeader, tap } from "../components/ui";
import type { PremiumFeature } from "../membership/entitlements";
import { useMembership } from "../membership/MembershipContext";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { LockedFeatureSheet, ProSection } from "../pro/ProGate";
import { C, DIAG, F, NAV_GAP, NAV_HEIGHT } from "../theme";
import type { DealFilter, ProDeal } from "./sponsorData";
import { PRO_DEALS, SPONSOR_CATEGORIES, SPONSOR_COPY, brandById, filterDeals, sponsorCategoryLabel } from "./sponsorData";
import { SponsoredChallengesSection } from "./SponsoredChallenges";
import { BrandMark, DemoBrandTag, SponsorSheet, ss } from "./sponsorUi";

type Props = {
  onBack: () => void;
  onOpenPremium: () => void;
  onToast: (m: string) => void;
  hiddenDeals: string[];
  onHideDeal: (id: string) => void;
  onRestoreDeals: () => void;
};

/** GYMX Pro Deals — fictional offer catalog preview. No prices, codes, savings or purchases. */
export function ProDealsScreen({ onBack, onOpenPremium, onToast, hiddenDeals, onHideDeal, onRestoreDeals }: Props) {
  const insets = useSafeAreaInsets();
  const membership = useMembership();
  const [filter, setFilter] = useState<DealFilter>("all");
  const [open, setOpen] = useState<ProDeal | null>(null);
  const [locked, setLocked] = useState<PremiumFeature | null>(null);
  const unlocked = membership.can("pro_deals_preview");
  const deals = filterDeals(PRO_DEALS, filter, hiddenDeals);
  const filters: { id: DealFilter; label: string }[] = [{ id: "all", label: "All" }, ...SPONSOR_CATEGORIES];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 28 }} showsVerticalScrollIndicator={false}>
        <PageHeader top={insets.top} kicker="GYMX Pro" title="Deals" leading={<IconBtn label="Back" onPress={onBack}><ArrowLeft size={20} color={C.white} /></IconBtn>} />
        <LinearGradient colors={["#3a1306", "#161010", "#0d0d0d"]} start={DIAG.start} end={DIAG.end} style={s.hero}>
          <Glows glows={[{ color: C.gold, cx: "100%", cy: "0%", rx: "80%", ry: "90%", opacity: 0.25 }, { color: C.flame, cx: "0%", cy: "100%", rx: "70%", ry: "70%", opacity: 0.25 }]} />
          <Text style={s.heroTitle}>{SPONSOR_COPY.dealsTitle}</Text>
          <Text style={s.heroSub}>{SPONSOR_COPY.dealsSubtitle}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <ComingSoonPill label="PRO DEALS · COMING SOON" />
            {unlocked ? <DemoBrandTag text={`DEMO · ${membership.plan.displayName.toUpperCase()}`} /> : null}
          </View>
          <Text style={s.heroNote}>{SPONSOR_COPY.dealsDisclaimer}</Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 16 }}>
          <ProSection feature="pro_deals_preview" title="Fictional offers" subtitle="Browse by category · tap an offer for details" onLocked={setLocked} teaserHeight={340}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }} accessibilityRole="radiogroup" accessibilityLabel="Deal category">
              {filters.map((f) => {
                const on = filter === f.id;
                return (
                  <Pressable key={f.id} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} onPress={() => { tap(); setFilter(f.id); }} style={[ss.chip, on && ss.chipOn]}>
                    <Text style={[ss.chipText, on && { color: "#fff" }]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={{ gap: 10, marginTop: 12 }}>
              {deals.map((d) => {
                const brand = brandById(d.brandId);
                return (
                  <View key={d.id} style={ss.card}>
                    <View style={ss.row}>
                      <BrandMark brand={brand} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.dealTitle}>{d.title}</Text>
                        <Text style={ss.muted}>{brand.name} · {sponsorCategoryLabel(d.category)}</Text>
                      </View>
                    </View>
                    <Text style={[ss.body, { marginTop: 8 }]}>{d.description}</Text>
                    <View style={[ss.row, { marginTop: 10 }]}>
                      <DemoBrandTag text="FICTIONAL PROTOTYPE OFFER" />
                    </View>
                    <View style={[ss.row, { marginTop: 10 }]}>
                      <Pressable accessibilityRole="button" accessibilityLabel={`View details: ${d.title}`} onPress={() => { tap(); setOpen(d); }} style={[ss.btn, { flex: 1, minHeight: 40 }]}>
                        <Eye size={15} color={C.white} /><Text style={[ss.btnText, { fontSize: 13 }]}>View details</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Hide offer: ${d.title}`} onPress={() => { tap(); onHideDeal(d.id); onToast("Offer hidden for this session."); }} style={[ss.btn, { minHeight: 40 }]}>
                        <EyeOff size={15} color={C.white} /><Text style={[ss.btnText, { fontSize: 13 }]}>Hide</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
              {deals.length === 0 ? <Text style={ss.muted}>No offers in this category{hiddenDeals.length ? " (some are hidden)" : ""}.</Text> : null}
            </View>
            {hiddenDeals.length ? (
              <Pressable accessibilityRole="button" onPress={() => { tap(); onRestoreDeals(); onToast("Hidden offers restored."); }} style={[ss.row, { marginTop: 12, alignSelf: "flex-start" }]}>
                <RotateCcw size={14} color={C.ash} /><Text style={ss.muted}>Show {hiddenDeals.length} hidden offer{hiddenDeals.length === 1 ? "" : "s"}</Text>
              </Pressable>
            ) : null}
          </ProSection>

          <View style={{ marginTop: 26 }}><SponsoredChallengesSection /></View>

          <View style={[ss.note, { marginTop: 22 }]}>
            <Info size={16} color={C.gold} />
            <Text style={ss.noteText}>Fewer interruptions. Better fitness offers. Premium plans still show clearly labelled sponsored posts — just less often.</Text>
          </View>
          {!unlocked ? (
            <Pressable accessibilityRole="button" onPress={() => { tap(); onOpenPremium(); }} style={[ss.btn, { marginTop: 12 }]}><Text style={ss.btnText}>See GYMX Premium</Text></Pressable>
          ) : null}
        </View>
      </ScrollView>

      <LockedFeatureSheet feature={locked} onClose={() => setLocked(null)} onOpenPremium={onOpenPremium} />
      <SponsorSheet visible={!!open} onClose={() => setOpen(null)} closeLabel="Close offer details" footer={
        <Pressable accessibilityRole="button" onPress={() => { tap(); setOpen(null); }} style={ss.btn}><ArrowLeft size={15} color={C.white} /><Text style={ss.btnText}>Back to deals</Text></Pressable>
      }>
        {open ? (
          <>
            <View style={ss.row}><BrandMark brand={brandById(open.brandId)} size={44} /><View style={{ flex: 1, gap: 4 }}><Text style={s.dealTitle}>{brandById(open.brandId).name}</Text><DemoBrandTag /></View></View>
            <Text style={[ss.title, { marginTop: 14 }]}>{open.title}</Text>
            <View style={{ marginTop: 8 }}><ComingSoonPill label="COMING SOON" /></View>
            <Text style={[ss.body, { marginTop: 10 }]}>{open.description}</Text>
            <Text style={[ss.kicker, { marginTop: 14, marginBottom: 6 }]}>{sponsorCategoryLabel(open.category)}</Text>
            {open.highlights.map((h) => <View key={h} style={[ss.row, { marginTop: 4 }]}><Tag size={13} color={C.gold} /><Text style={[ss.body, { flex: 1 }]}>{h}</Text></View>)}
            <View style={[ss.note, { marginTop: 14 }]}><ShieldCheck size={16} color={C.gold} /><Text style={ss.noteText}>{SPONSOR_COPY.dealsDisclaimer}</Text></View>
          </>
        ) : null}
      </SponsorSheet>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { marginHorizontal: 16, padding: 18, borderRadius: 24, overflow: "hidden", gap: 10, borderWidth: 1, borderColor: "rgba(255,209,102,0.3)" },
  heroTitle: { fontFamily: F.display, fontSize: 34, lineHeight: 38, color: C.white },
  heroSub: { fontSize: 15, fontWeight: "600", color: "rgba(255,247,237,0.9)" },
  heroNote: { fontSize: 12, lineHeight: 17, color: "rgba(255,247,237,0.72)" },
  dealTitle: { fontFamily: F.labelHeavy, fontSize: 16, letterSpacing: 0.6, color: C.white },
});
