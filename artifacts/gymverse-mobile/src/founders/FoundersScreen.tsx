import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Circle, Info, ShieldCheck, Sparkles, Users } from "lucide-react-native";
import { Glows } from "../components/Tone";
import { IconBtn, PageHeader, tap } from "../components/ui";
import { useMembership } from "../membership/MembershipContext";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { C, DIAG, F, NAV_GAP, NAV_HEIGHT } from "../theme";
import { FounderMedallion } from "./FounderBadge";
import { FIRST_1000, FOUNDER_BENEFITS, FOUNDER_COMBINATIONS, FOUNDER_COPY } from "./foundersData";

/** GYMVERSE Founders recognition concept. Reads the membership only to describe it — never changes it. */
export function FoundersScreen({ onBack, founderPreview }: { onBack: () => void; founderPreview: boolean }) {
  const insets = useSafeAreaInsets();
  const { plan, tier } = useMembership();
  const planName = tier === "FREE" ? "Free" : plan.displayName;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 28 }} showsVerticalScrollIndicator={false}>
      <PageHeader top={insets.top} kicker="Recognition concept" title="Founders" leading={<IconBtn label="Back" onPress={onBack}><ArrowLeft size={20} color={C.white} /></IconBtn>} />

      <LinearGradient colors={["#1b1508", "#0f0d0a", "#090909"]} start={DIAG.start} end={DIAG.end} style={s.hero}>
        <Glows glows={[{ color: C.gold, cx: "50%", cy: "0%", rx: "90%", ry: "70%", opacity: 0.2 }, { color: C.flame, cx: "50%", cy: "100%", rx: "80%", ry: "50%", opacity: 0.16 }]} />
        <FounderMedallion />
        <Text style={s.title}>{FOUNDER_COPY.title}</Text>
        <Text style={s.tagline}>{FOUNDER_COPY.tagline}</Text>
        <Text style={s.desc}>{FOUNDER_COPY.description}</Text>
        <View style={{ alignSelf: "center" }}><ComingSoonPill label={FOUNDER_COPY.pill} /></View>
        <View style={s.status} accessibilityLiveRegion="polite">
          <Text style={s.statusText}>
            {founderPreview ? `Founder preview is ON for this session · plan: ${planName}` : `Founder preview is off · plan: ${planName}`}
          </Text>
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: 16 }}>
        <Text style={s.h2}>Not a membership</Text>
        <Text style={s.body}>{FOUNDER_COPY.separation}</Text>
        <View style={s.grid}>
          {FOUNDER_COMBINATIONS.map((c) => (
            <View key={c.label} style={s.combo}>
              <Text style={s.comboTitle}>{c.label}</Text>
              <Text style={s.muted}>{c.detail}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>What recognition could look like</Text>
        <View style={{ gap: 8 }}>
          {FOUNDER_BENEFITS.map((b) => (
            <View key={b.title} style={s.benefit}>
              <Sparkles size={16} color={C.gold} />
              <View style={{ flex: 1 }}>
                <Text style={s.benefitTitle}>{b.title}</Text>
                <Text style={s.muted}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <LinearGradient colors={["#2a1407", "#141010"]} start={DIAG.start} end={DIAG.end} style={s.first}>
          <View style={s.row}><Users size={16} color={C.flame} /><Text style={s.kicker}>Founding-community challenge · concept</Text></View>
          <Text style={s.firstTitle}>{FIRST_1000.title}</Text>
          <Text style={s.tagline}>{FIRST_1000.tagline}</Text>
          <Text style={[s.body, { marginTop: 6 }]}>{FIRST_1000.concept}</Text>
          <View style={{ gap: 6, marginTop: 10 }}>
            {FIRST_1000.milestones.map((m) => <View key={m} style={s.row}><Circle size={12} color={C.ash} /><Text style={s.body}>{m}</Text></View>)}
          </View>
          <Text style={[s.muted, { marginTop: 10 }]}>{FIRST_1000.disclaimer}</Text>
        </LinearGradient>

        <View style={[s.note, { marginTop: 18 }]}><Info size={16} color={C.gold} /><Text style={s.noteText}>{FOUNDER_COPY.notFinal}</Text></View>
        <View style={[s.note, { marginTop: 8 }]}><ShieldCheck size={16} color={C.gold} /><Text style={s.noteText}>{FOUNDER_COPY.rules} {FOUNDER_COPY.notCredential}</Text></View>
        <Pressable accessibilityRole="button" onPress={() => { tap(); onBack(); }} style={s.back}><ArrowLeft size={15} color={C.white} /><Text style={s.backText}>Back</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero: { marginHorizontal: 16, padding: 20, borderRadius: 26, overflow: "hidden", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "rgba(255,209,102,0.35)" },
  title: { marginTop: 4, fontFamily: F.display, fontSize: 32, letterSpacing: 1, color: C.white, textAlign: "center" },
  tagline: { fontFamily: F.labelHeavy, fontSize: 16, letterSpacing: 0.6, color: C.gold, textAlign: "center" },
  desc: { fontSize: 14, lineHeight: 20, color: "rgba(255,247,237,0.85)", textAlign: "center" },
  status: { marginTop: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: "rgba(255,247,237,0.06)" },
  statusText: { fontSize: 12, color: C.ash, textAlign: "center" },
  h2: { marginTop: 24, marginBottom: 8, fontFamily: F.display, fontSize: 22, textTransform: "uppercase", color: C.white },
  body: { fontSize: 14, lineHeight: 20, color: "rgba(255,247,237,0.86)" },
  muted: { fontSize: 12.5, lineHeight: 17, color: C.ash },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  combo: { width: "48%", flexGrow: 1, padding: 12, borderRadius: 14, backgroundColor: "#141210", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,209,102,0.3)" },
  comboTitle: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 0.6, color: C.gold, marginBottom: 2 },
  benefit: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 14, backgroundColor: "#131313" },
  benefitTitle: { fontFamily: F.labelHeavy, fontSize: 15, color: C.white },
  first: { marginTop: 22, padding: 16, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,90,31,0.35)" },
  firstTitle: { marginTop: 6, fontFamily: F.display, fontSize: 30, color: C.white },
  kicker: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1.3, textTransform: "uppercase", color: C.flame },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  note: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 11, borderRadius: 13, backgroundColor: "rgba(255,209,102,0.07)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,209,102,0.3)" },
  noteText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: "rgba(255,247,237,0.82)" },
  back: { marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,247,237,0.18)" },
  backText: { fontFamily: F.labelHeavy, fontSize: 14.5, letterSpacing: 1, textTransform: "uppercase", color: C.white },
});
