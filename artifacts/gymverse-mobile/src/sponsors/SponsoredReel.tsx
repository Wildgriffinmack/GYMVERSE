import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, Ellipsis, Tag } from "lucide-react-native";
import { Glows } from "../components/Tone";
import { tap } from "../components/ui";
import { C, DIAG, F, GRAD, NAV_GAP, NAV_HEIGHT } from "../theme";
import type { SponsoredPlacement } from "./sponsorData";
import { sponsorCategoryLabel } from "./sponsorData";
import { BRAND_GRADIENTS, BrandMark, DemoBrandTag, SponsoredLabel, brandIcon } from "./sponsorUi";

/**
 * Full-height sponsored card for the Home Feed. Visibly different from member posts: square brand mark,
 * high-contrast SPONSORED label, no like/comment/save/share rail (so it can never register engagement).
 */
export const SponsoredReel = memo(function SponsoredReel({ placement, height, onExplore, onOptions }: { placement: SponsoredPlacement; height: number; onExplore: (p: SponsoredPlacement) => void; onOptions: (p: SponsoredPlacement) => void }) {
  const insets = useSafeAreaInsets();
  const { campaign, brand } = placement;
  const [a, b, c] = BRAND_GRADIENTS[brand.tone];
  const navSpace = insets.bottom + NAV_GAP + NAV_HEIGHT;
  return (
    <View style={{ height, overflow: "hidden", backgroundColor: "#000" }} accessibilityLabel={`Sponsored post from ${brand.name}, fictional demo brand`}>
      <LinearGradient colors={[b, c, "#050505"]} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <Glows glows={[{ color: a, cx: "90%", cy: "18%", rx: "75%", ry: "45%", opacity: 0.45 }, { color: C.hot, cx: "0%", cy: "70%", rx: "60%", ry: "40%", opacity: 0.18 }]} />
      <View style={[s.watermark, { top: height * 0.16 }]} pointerEvents="none">{brandIcon(brand.icon, 240, "rgba(255,247,237,0.07)")}</View>
      <View style={[s.hero, { top: height * 0.24 }]} pointerEvents="none">
        <Text style={s.heroKicker}>{brand.name}</Text>
        <Text style={s.heroTitle}>{campaign.headline}</Text>
        <View style={[s.heroLine, { backgroundColor: a }]} />
      </View>

      <View style={[s.badges, { top: insets.top + 100 }]} pointerEvents="none">
        <SponsoredLabel large />
        <DemoBrandTag />
      </View>

      <View style={[s.info, { bottom: navSpace + 22 }]}>
        <View style={s.author}>
          <BrandMark brand={brand} size={42} />
          <View style={{ flexShrink: 1 }}>
            <Text style={s.brand} numberOfLines={1}>{brand.name}</Text>
            <Text style={s.meta}>Sponsored · fictional demo brand</Text>
          </View>
        </View>
        <Text style={s.desc} numberOfLines={2}>{campaign.description}</Text>
        <View style={s.offerRow}>
          <View style={s.cat}><Text style={s.catText}>{sponsorCategoryLabel(campaign.category)}</Text></View>
          <View style={s.offer}><Tag size={12} color={C.gold} /><Text style={s.offerText} numberOfLines={1}>{campaign.offerPreview}</Text></View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${campaign.cta}: ${brand.name} sponsored offer`} onPress={() => { tap(); onExplore(placement); }} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
          <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.cta}>
            <Text style={s.ctaText}>{campaign.cta}</Text>
            <ArrowRight size={18} color="#fff" strokeWidth={2.6} />
          </LinearGradient>
        </Pressable>
      </View>

      <View style={[s.rail, { bottom: navSpace + 120 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Sponsored post options: ${brand.name}`} onPress={() => { tap(); onOptions(placement); }} style={({ pressed }) => [s.railBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
          <Ellipsis size={26} color={C.white} />
        </Pressable>
        <Text style={s.railText}>Options</Text>
      </View>
    </View>
  );
});

const shadow = { textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 } };

const s = StyleSheet.create({
  watermark: { position: "absolute", right: -40 },
  hero: { position: "absolute", left: 22, right: 22, gap: 6 },
  heroKicker: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 3, color: "rgba(255,247,237,0.75)" },
  heroTitle: { fontFamily: F.display, fontSize: 52, lineHeight: 56, color: C.white, ...shadow },
  heroLine: { width: 64, height: 4, borderRadius: 2, marginTop: 4 },
  badges: { position: "absolute", left: 16, right: 80, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  info: { position: "absolute", left: 16, right: 76, gap: 9 },
  author: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { fontFamily: F.labelHeavy, fontSize: 16, letterSpacing: 1, color: C.white, ...shadow },
  meta: { fontSize: 12, color: C.muted },
  desc: { color: C.white, fontSize: 15, lineHeight: 21, fontWeight: "500", ...shadow },
  offerRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  cat: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, backgroundColor: "rgba(255,247,237,0.14)" },
  catText: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.3, textTransform: "uppercase", color: C.white },
  offer: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1 },
  offerText: { fontSize: 12.5, color: C.gold, flexShrink: 1 },
  cta: { height: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText: { fontFamily: F.labelHeavy, fontSize: 16, letterSpacing: 1.3, textTransform: "uppercase", color: "#fff" },
  rail: { position: "absolute", right: 12, alignItems: "center", gap: 3 },
  railBtn: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(9,9,9,0.4)", borderWidth: 1, borderColor: "rgba(255,247,237,0.2)" },
  railText: { fontFamily: F.label, fontSize: 12, color: C.white, ...shadow },
});
