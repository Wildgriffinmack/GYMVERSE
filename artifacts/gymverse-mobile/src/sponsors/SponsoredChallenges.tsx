import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, CalendarDays, Info, Target, Trophy } from "lucide-react-native";
import { tap } from "../components/ui";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { C, F } from "../theme";
import type { SponsoredChallenge } from "./sponsorData";
import { SPONSORED_CHALLENGES, SPONSOR_COPY, brandById } from "./sponsorData";
import { BRAND_GRADIENTS, BrandMark, DemoBrandTag, SponsorSheet, SponsoredLabel, ss } from "./sponsorUi";

/** Reusable "sponsored by" strip for any challenge card. */
export function ChallengeSponsorStrip({ brandId }: { brandId: string }) {
  const brand = brandById(brandId);
  return (
    <View style={s.strip} accessibilityLabel={`Sponsored by ${brand.name}, fictional demo brand`}>
      <SponsoredLabel />
      <Text style={s.stripText} numberOfLines={1}>by {brand.name}</Text>
    </View>
  );
}

export function SponsoredChallengeCard({ challenge, onOpen }: { challenge: SponsoredChallenge; onOpen: (c: SponsoredChallenge) => void }) {
  const brand = brandById(challenge.brandId);
  const [a, b] = BRAND_GRADIENTS[brand.tone];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${challenge.title}, sponsored challenge preview by ${brand.name}. Open details`} onPress={() => { tap(); onOpen(challenge); }} style={({ pressed }) => [s.card, { opacity: pressed ? 0.88 : 1 }]}>
      <LinearGradient colors={[b, "#141414"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <ChallengeSponsorStrip brandId={challenge.brandId} />
      <Text style={s.title}>{challenge.title}</Text>
      <View style={[ss.row, { gap: 14 }]}>
        <View style={ss.row}><CalendarDays size={13} color={a} /><Text style={s.meta}>{challenge.duration}</Text></View>
        <View style={[ss.row, { flex: 1 }]}><Target size={13} color={a} /><Text style={s.meta} numberOfLines={1}>{challenge.focus}</Text></View>
      </View>
      <View style={[ss.row, { justifyContent: "space-between" }]}>
        <DemoBrandTag text="PREVIEW · COMING SOON" />
        <ArrowRight size={18} color={C.white} />
      </View>
    </Pressable>
  );
}

/** Self-contained section with its own detail sheet, so it can sit under existing screens without changing them. */
export function SponsoredChallengesSection({ title = "Sponsored challenge previews" }: { title?: string }) {
  const [open, setOpen] = useState<SponsoredChallenge | null>(null);
  const brand = open ? brandById(open.brandId) : null;
  return (
    <View style={{ gap: 10 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={ss.body}>{SPONSOR_COPY.challengeRewards}</Text>
      {SPONSORED_CHALLENGES.map((c) => <SponsoredChallengeCard key={c.id} challenge={c} onOpen={setOpen} />)}
      <Text style={ss.muted}>{SPONSOR_COPY.challengeNote}</Text>

      <SponsorSheet visible={!!open} onClose={() => setOpen(null)} closeLabel="Close challenge preview" footer={
        <Pressable accessibilityRole="button" onPress={() => { tap(); setOpen(null); }} style={ss.btn}><Text style={ss.btnText}>Back to challenges</Text></Pressable>
      }>
        {open && brand ? (
          <>
            <View style={ss.row}><BrandMark brand={brand} size={40} /><View style={{ flex: 1, gap: 4 }}><Text style={s.sheetBrand}>{brand.name}</Text><DemoBrandTag /></View></View>
            <Text style={[ss.title, { marginTop: 14 }]}>{open.title}</Text>
            <View style={{ marginTop: 8 }}><ComingSoonPill label="SPONSORED CHALLENGES · COMING SOON" /></View>
            <Text style={[ss.kicker, { marginTop: 16, marginBottom: 4 }]}>Duration</Text>
            <Text style={ss.body}>{open.duration}</Text>
            <Text style={[ss.kicker, { marginTop: 12, marginBottom: 4 }]}>Training focus</Text>
            <Text style={ss.body}>{open.focus}</Text>
            <Text style={[ss.kicker, { marginTop: 12, marginBottom: 4 }]}>Reward concept</Text>
            <View style={ss.row}><Trophy size={14} color={C.gold} /><Text style={[ss.body, { flex: 1 }]}>{open.rewardConcept}</Text></View>
            <View style={[ss.note, { marginTop: 14 }]}><Info size={16} color={C.gold} /><Text style={ss.noteText}>{SPONSOR_COPY.challengeRewards} {SPONSOR_COPY.challengeNote}</Text></View>
          </>
        ) : null}
      </SponsorSheet>
    </View>
  );
}

const s = StyleSheet.create({
  strip: { flexDirection: "row", alignItems: "center", gap: 8 },
  stripText: { flexShrink: 1, fontFamily: F.labelHeavy, fontSize: 12.5, letterSpacing: 1, color: "rgba(255,247,237,0.85)" },
  card: { padding: 14, gap: 10, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,247,237,0.12)" },
  title: { fontFamily: F.display, fontSize: 24, lineHeight: 28, color: C.white },
  meta: { fontSize: 12.5, color: "rgba(255,247,237,0.85)", flexShrink: 1 },
  sectionTitle: { fontFamily: F.display, fontSize: 24, lineHeight: 28, textTransform: "uppercase", color: C.white },
  sheetBrand: { fontFamily: F.labelHeavy, fontSize: 16, letterSpacing: 1, color: C.white },
});
